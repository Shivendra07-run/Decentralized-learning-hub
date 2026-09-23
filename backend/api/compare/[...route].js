const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

const PollPostSchema = z.object({
  poll: z.string().default('web2-vs-web3'),
  choice: z.enum(['web2', 'web3', 'depends'])
});

const FreezeSchema = z.object({
  frozen: z.boolean()
});

function getSubRoute(req) {
  const r = req.query?.route;
  if (Array.isArray(r)) return r.join('/');
  if (typeof r === 'string') return r;
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[0] === 'api') {
        return parts.slice(2).join('/');
      }
    } catch (e) {}
  }
  return '';
}

async function getPollCounts(pollId) {
  const { data } = await supabase
    .from('compare_votes')
    .select('choice')
    .eq('poll_id', pollId);

  let web2 = 0, web3 = 0, depends = 0;
  if (data && Array.isArray(data)) {
    for (const v of data) {
      if (v.choice === 'web2') web2++;
      else if (v.choice === 'web3') web3++;
      else if (v.choice === 'depends') depends++;
    }
  }
  return {
    web2,
    web3,
    depends,
    total: web2 + web3 + depends
  };
}

function resolveVoterKey(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded && decoded.sub) {
          return decoded.sub.toLowerCase();
        }
      } catch (e) {}
    }
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'unknown';
  const salt = process.env.JWT_SECRET || 'aether-salt';
  return crypto.createHash('sha256').update(`${ip}:${ua}:${salt}`).digest('hex');
}

module.exports = handler(async (req, res) => {
  const subRoute = getSubRoute(req).toLowerCase();

  // 1. GET /api/compare/rows
  if (subRoute === 'rows') {
    if (req.method !== 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 60)) return;

    try {
      const { data, error } = await supabase
        .from('compare_rows')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[Compare Rows] Supabase query error:', error.message);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to fetch comparison rows' }));
        return;
      }

      const rows = (data || []).map((row) => ({
        id: row.id,
        topic: row.topic || row.title,
        web2: {
          title: row.web2?.title || row.web2_title || row.web2?.badge || '',
          text: row.web2?.text || row.web2_text || row.web2?.desc || ''
        },
        web3: {
          title: row.web3?.title || row.web3_title || row.web3?.badge || '',
          text: row.web3?.text || row.web3_text || row.web3?.desc || ''
        }
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      res.statusCode = 200;
      res.end(JSON.stringify(rows));
    } catch (err) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // 2. /api/compare/poll (GET & POST)
  if (subRoute === 'poll') {
    if (req.method === 'GET') {
      if (!checkRateLimit(req, res, 60)) return;

      let pollId = req.query?.poll;
      if (!pollId && req.url) {
        try {
          const parsed = new URL(req.url, 'http://localhost');
          pollId = parsed.searchParams.get('poll');
        } catch (e) {}
      }
      pollId = pollId || 'web2-vs-web3';

      try {
        const counts = await getPollCounts(pollId);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(counts));
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to fetch poll counts' }));
      }
      return;
    }

    if (req.method === 'POST') {
      if (!checkRateLimit(req, res, 30)) return;

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

      const parseResult = PollPostSchema.safeParse(body);
      if (!parseResult.success) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid vote payload' }));
        return;
      }

      const { poll, choice } = parseResult.data;
      const voterKey = resolveVoterKey(req);

      try {
        const { error: upsertErr } = await supabase
          .from('compare_votes')
          .upsert({
            voter_key: voterKey,
            poll_id: poll,
            choice: choice,
            updated_at: new Date().toISOString()
          }, { onConflict: 'voter_key,poll_id' });

        if (upsertErr) {
          console.warn('[Compare Poll] Supabase vote upsert warning:', upsertErr.message);
        }

        const counts = await getPollCounts(poll);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(counts));
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to record vote' }));
      }
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // 3. GET /api/compare/demo-state
  if (subRoute === 'demo-state') {
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
    return;
  }

  // 4. POST /api/compare/demo-login
  if (subRoute === 'demo-login') {
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
    return;
  }

  // 5. POST /api/compare/demo-freeze
  if (subRoute === 'demo-freeze') {
    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

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
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Route not found' }));
});
