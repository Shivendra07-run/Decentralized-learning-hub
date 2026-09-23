const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

const PostSchema = z.object({
  poll: z.string().default('web2-vs-web3'),
  choice: z.enum(['web2', 'web3', 'depends'])
});

async function getPollCounts(pollId) {
  const { data, error } = await supabase
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

    const parseResult = PostSchema.safeParse(body);
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
          poll_id: poll,
          voter_key: voterKey,
          choice: choice,
          updated_at: new Date().toISOString()
        }, { onConflict: 'poll_id,voter_key' });

      if (upsertErr) {
        console.warn('[Compare Poll] Vote upsert error:', upsertErr.message);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to record vote' }));
        return;
      }

      const counts = await getPollCounts(poll);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        ...counts,
        userChoice: choice
      }));
    } catch (err) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Server error recording vote' }));
    }
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});
