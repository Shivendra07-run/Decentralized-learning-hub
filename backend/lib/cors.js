const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function handler(fn) {
  return async function (req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      await fn(req, res);
    } catch (err) {
      console.error('[API Error]', err);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        const status = (typeof err.status === 'number' && err.status >= 400 && err.status < 600) ? err.status : 500;
        const message = status < 500 ? (err.message || 'Client error') : 'Server error';
        res.statusCode = status;
        res.end(JSON.stringify({ error: message }));
      }
    }
  };
}

module.exports = {
  setCorsHeaders,
  handler
};
