const crypto = require('crypto');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 30)) {
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');

  const { error } = await supabase
    .from('auth_nonces')
    .insert([{
      nonce,
      used: false,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('[Nonce] Supabase insert error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to generate authentication nonce' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ nonce }));
});
