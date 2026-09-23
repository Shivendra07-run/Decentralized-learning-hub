const jwt = require('jsonwebtoken');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

function shortenAddress(addr) {
  if (!addr || typeof addr !== 'string' || addr.length < 10) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 60)) return;

  // Set 30-second edge cache header
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  // Check if caller is authenticated
  let callerAddress = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded && decoded.sub && typeof decoded.sub === 'string') {
          callerAddress = decoded.sub.toLowerCase();
        }
      } catch (err) {
        // Unauthenticated or expired token
      }
    }
  }

  let attempts = [];
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('address, score, total, created_at')
        .not('address', 'is', null)
        .order('score', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        attempts = data;
      }
    }
  } catch (err) {
    console.warn('[Quiz Leaderboard] Database query warning:', err.message);
  }

  // Deduplicate by address to pick each address's single best score (and earliest time for that score)
  const bestMap = new Map();
  for (const row of attempts) {
    if (!row.address) continue;
    const addr = row.address.toLowerCase();
    if (!bestMap.has(addr)) {
      bestMap.set(addr, {
        address: addr,
        score: typeof row.score === 'number' ? row.score : 0,
        total: typeof row.total === 'number' ? row.total : 10,
        created_at: row.created_at
      });
    }
  }

  const sortedLeaderboard = Array.from(bestMap.values());
  sortedLeaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });

  // Calculate caller's own best score if authenticated
  let userBest = null;
  if (callerAddress) {
    const userIndex = sortedLeaderboard.findIndex(item => item.address === callerAddress);
    if (userIndex !== -1) {
      const entry = sortedLeaderboard[userIndex];
      userBest = {
        rank: userIndex + 1,
        address: shortenAddress(entry.address),
        rawAddress: entry.address,
        score: entry.score,
        total: entry.total,
        created_at: entry.created_at
      };
    }
  }

  // Top 10 leaderboard entries
  const top10 = sortedLeaderboard.slice(0, 10).map((item, idx) => ({
    rank: idx + 1,
    address: shortenAddress(item.address),
    score: item.score,
    total: item.total,
    created_at: item.created_at
  }));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    leaderboard: top10,
    userBest: userBest
  }));
});
