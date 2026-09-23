const { z } = require('zod');
const { handler } = require('../lib/cors');
const { requireAuth } = require('../lib/auth');
const { checkRateLimit } = require('../lib/ratelimit');
const { supabase } = require('../lib/supabase');

const ProgressSchema = z.object({
  data: z.record(
    z.string(),
    z.union([z.boolean(), z.number()])
  ).refine(val => Object.keys(val).length <= 50, {
    message: 'Data object must contain at most 50 keys'
  })
});

module.exports = handler(async (req, res) => {
  // 1. GET /api/progress - Retrieve caller's progress
  if (req.method === 'GET') {
    if (!checkRateLimit(req, res, 60)) return;

    const address = requireAuth(req);

    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const { data, error } = await supabase
          .from('user_progress')
          .select('data')
          .eq('address', address.toLowerCase())
          .maybeSingle();

        if (error) {
          console.warn('[Progress GET] Supabase query warning:', error.message);
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: data?.data || {} }));
        return;
      }
    } catch (err) {
      console.warn('[Progress GET] Error fetching progress:', err.message);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ data: {} }));
    return;
  }

  // 2. PUT /api/progress - Upsert caller's progress
  if (req.method === 'PUT') {
    if (!checkRateLimit(req, res, 30)) return;

    const address = requireAuth(req);

    // Validate request size is strictly under 4 KB (4096 bytes)
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (Buffer.byteLength(rawPayload, 'utf8') > 4096) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Payload exceeds 4 KB size limit' }));
      return;
    }

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

    const parseResult = ProgressSchema.safeParse(body);
    if (!parseResult.success) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid progress data payload' }));
      return;
    }

    const progressData = parseResult.data.data;

    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const { error: upsertErr } = await supabase
          .from('user_progress')
          .upsert({
            address: address.toLowerCase(),
            data: progressData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'address' });

        if (upsertErr) {
          console.warn('[Progress PUT] Supabase upsert warning:', upsertErr.message);
        }
      }
    } catch (err) {
      console.warn('[Progress PUT] Error saving progress:', err.message);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, data: progressData }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});
