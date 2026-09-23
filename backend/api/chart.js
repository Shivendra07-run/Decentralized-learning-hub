const { z } = require('zod');
const { handler } = require('../lib/cors');
const { checkRateLimit } = require('../lib/ratelimit');

const ALLOWED_COIN_IDS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'tether',
  'polygon-ecosystem-token',
  'chainlink'
];

const QuerySchema = z.object({
  id: z.enum(ALLOWED_COIN_IDS, {
    errorMap: () => ({ message: 'id must be one of: ' + ALLOWED_COIN_IDS.join(', ') })
  })
});

const lastSuccessfulCharts = {};

function downsample(rawPrices, maxPoints = 60) {
  if (!Array.isArray(rawPrices) || rawPrices.length === 0) return [];
  if (rawPrices.length <= maxPoints) {
    return rawPrices.map(item => ({ t: item[0], price: item[1] }));
  }
  const result = [];
  const total = rawPrices.length;
  const step = (total - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    const item = rawPrices[index];
    if (item && Array.isArray(item)) {
      result.push({ t: item[0], price: item[1] });
    }
  }
  return result;
}

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 60)) {
    return;
  }

  let coinId = req.query?.id;
  if (!coinId && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      coinId = parsedUrl.searchParams.get('id');
    } catch (e) {}
  }

  const parseResult = QuerySchema.safeParse({ id: coinId });
  if (!parseResult.success) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid coin id' }));
    return;
  }

  const id = parseResult.data.id;
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=7`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Aether-Education/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.prices)) {
      throw new Error('Invalid market chart format from upstream');
    }

    const points = downsample(data.prices, 60);
    lastSuccessfulCharts[id] = points;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.statusCode = 200;
    res.end(JSON.stringify(points));
  } catch (err) {
    if (lastSuccessfulCharts[id]) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      res.statusCode = 200;
      res.end(JSON.stringify(lastSuccessfulCharts[id]));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'Failed to fetch chart data from upstream provider' }));
  }
});
