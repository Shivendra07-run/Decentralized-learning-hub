const { handler } = require('../../lib/cors');
const { requireAuth } = require('../../lib/auth');
const { checkRateLimit } = require('../../lib/ratelimit');

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

  const address = requireAuth(req);

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ address }));
});
