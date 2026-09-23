const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');
const { QUESTIONS } = require('../../lib/quizData');

const SubmitSchema = z.object({
  answers: z.array(z.object({
    id: z.number().int().positive(),
    choice: z.number().int().min(0).max(3)
  })).min(1)
});

function shortenAddress(addr) {
  if (!addr || typeof addr !== 'string' || addr.length < 10) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

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

module.exports = handler(async (req, res) => {
  const subRoute = getSubRoute(req).toLowerCase();

  // 1. GET /api/quiz/questions
  if (subRoute === 'questions') {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 60)) return;

    const sanitizedQuestions = QUESTIONS.map(q => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options
    }));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.end(JSON.stringify({ questions: sanitizedQuestions }));
    return;
  }

  // 2. POST /api/quiz/submit
  if (subRoute === 'submit') {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 30)) return;

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }
    }

    const parseResult = SubmitSchema.safeParse(body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid answers payload' }));
      return;
    }

    const { answers } = parseResult.data;

    const questionMap = new Map();
    QUESTIONS.forEach(q => questionMap.set(q.id, q));

    let score = 0;
    const results = answers.map(ans => {
      const q = questionMap.get(ans.id);
      if (!q) {
        return {
          id: ans.id,
          correct: false,
          correctChoice: 0,
          explanation: 'Question not found'
        };
      }

      const isCorrect = (ans.choice === q.correct);
      if (isCorrect) {
        score++;
      }

      return {
        id: q.id,
        correct: isCorrect,
        correctChoice: q.correct,
        explanation: q.explanation
      };
    });

    const total = QUESTIONS.length;

    // Extract address if caller provided a valid Bearer JWT
    let address = null;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret);
          if (decoded && decoded.sub && typeof decoded.sub === 'string') {
            address = decoded.sub.toLowerCase();
          }
        } catch (err) {
          // Unauthenticated or expired token
        }
      }
    }

    // Insert attempt into Supabase quiz_attempts table
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await supabase.from('quiz_attempts').insert({
          address: address,
          score: score,
          total: total
        });
      }
    } catch (dbErr) {
      console.warn('[Quiz Submit] Supabase attempt record failed:', dbErr.message);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      score,
      total,
      results
    }));
    return;
  }

  // 3. GET /api/quiz/leaderboard
  if (subRoute === 'leaderboard') {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 60)) return;

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

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
        } catch (err) {}
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
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Route not found' }));
});
