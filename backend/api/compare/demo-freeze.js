const { z } = require('zod');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

const FreezeSchema = z.object({
  frozen: z.boolean()
});

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Rate limit strictly: 5 requests per minute
  if (!checkRateLimit(req, res, 5)) return;

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      return;
    }
  }

  const parseResult = FreezeSchema.safeParse(body);
  if (!parseResult.success) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid payload: frozen must be a boolean' }));
    return;
  }

  const { frozen } = parseResult.data;

  // IMPORTANT: For educational safety, this simulation endpoint ONLY ever touches the 'demo1' educational simulation record.
  try {
    const { error } = await supabase
      .from('demo_accounts')
      .upsert({
        id: 'demo1',
        username: 'demo_user',
        frozen: frozen,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Demo Freeze] Supabase update warning:', error.message);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to update simulation state' }));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, frozen }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});
