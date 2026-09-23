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

module.exports = handler(async (req, res) => {
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
        // Expired or invalid token, treat as unauthenticated attempt
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
});
