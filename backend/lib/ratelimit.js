/**
 * In-memory sliding/fixed window rate limiter keyed by IP + route.
 * 
 * NOTE: In a serverless environment (such as Vercel), this in-memory map
 * is maintained per warm container instance and resets when a container
 * cold-starts or scales down.
 */

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;     // 30 requests per minute

function checkRateLimit(req, res, limit = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
  const route = req.url ? req.url.split('?')[0] : 'unknown';
  const key = `${ip}:${route}`;

  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  requestCounts.set(key, record);

  // Prune map periodically to prevent unbounded memory growth on long-lived warm containers
  if (requestCounts.size > 1000) {
    for (const [k, v] of requestCounts.entries()) {
      if (now > v.resetTime) requestCounts.delete(k);
    }
  }

  if (record.count > limit) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
    return false;
  }

  return true;
}

module.exports = {
  checkRateLimit
};
