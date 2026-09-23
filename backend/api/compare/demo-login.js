const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 30)) return;

  try {
    const { data } = await supabase
      .from('demo_accounts')
      .select('username, frozen')
      .eq('id', 'demo1')
      .maybeSingle();

    const isFrozen = Boolean(data?.frozen);

    if (isFrozen) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Account frozen by the platform' }));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      message: 'Logged in as demo_user'
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Simulation login error' }));
  }
});
