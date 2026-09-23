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

  if (!checkRateLimit(req, res, 60)) return;

  try {
    const { data } = await supabase
      .from('demo_accounts')
      .select('username, frozen')
      .eq('id', 'demo1')
      .maybeSingle();

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      username: data?.username || 'demo_user',
      frozen: Boolean(data?.frozen)
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      username: 'demo_user',
      frozen: false
    }));
  }
});
