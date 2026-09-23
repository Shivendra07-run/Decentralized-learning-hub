const { handler } = require('../lib/cors');
const { checkRateLimit } = require('../lib/ratelimit');

const COINGECKO_PRICES_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,tether,polygon-ecosystem-token,chainlink&vs_currencies=usd&include_24hr_change=true';

const COIN_META = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  solana: { name: 'Solana', symbol: 'SOL' },
  binancecoin: { name: 'BNB', symbol: 'BNB' },
  tether: { name: 'Tether', symbol: 'USDT' },
  'polygon-ecosystem-token': { name: 'Polygon', symbol: 'POL' },
  chainlink: { name: 'Chainlink', symbol: 'LINK' }
};

let lastSuccessfulPrices = null;

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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(COINGECKO_PRICES_URL, {
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

    const json = await response.json();
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid JSON payload received from CoinGecko');
    }

    const cleanArray = [];
    for (const [id, meta] of Object.entries(COIN_META)) {
      const coin = json[id];
      if (coin && typeof coin.usd === 'number' && !isNaN(coin.usd)) {
        cleanArray.push({
          id,
          name: meta.name,
          symbol: meta.symbol,
          usd: coin.usd,
          change24h: typeof coin.usd_24h_change === 'number' && !isNaN(coin.usd_24h_change)
            ? coin.usd_24h_change
            : 0
        });
      }
    }

    if (cleanArray.length === 0) {
      throw new Error('No valid coin records in upstream response');
    }

    const fetchedAt = new Date().toISOString();
    lastSuccessfulPrices = {
      prices: cleanArray,
      data: cleanArray,
      fetchedAt
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.statusCode = 200;
    res.end(JSON.stringify({
      prices: cleanArray,
      data: cleanArray,
      fetchedAt,
      stale: false
    }));
  } catch (err) {
    if (lastSuccessfulPrices) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      res.statusCode = 200;
      res.end(JSON.stringify({
        prices: lastSuccessfulPrices.prices,
        data: lastSuccessfulPrices.data,
        fetchedAt: lastSuccessfulPrices.fetchedAt,
        stale: true
      }));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'Failed to fetch prices from upstream provider' }));
  }
});
