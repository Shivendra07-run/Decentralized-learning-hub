const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { QUESTIONS } = require('../../lib/quizData');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 60)) return;

  // Return questions and options only, never correct answers or explanations
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
});
