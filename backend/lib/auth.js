const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }
  return secret;
}

function signToken(address) {
  if (!address || typeof address !== 'string') {
    const err = new Error('Valid address required');
    err.status = 400;
    throw err;
  }
  const secret = getJwtSecret();
  return jwt.sign(
    { sub: address.toLowerCase() },
    secret,
    { expiresIn: '12h' }
  );
}

function requireAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized: Missing or malformed Bearer token');
    error.status = 401;
    throw error;
  }

  const token = authHeader.slice(7).trim();
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.sub || typeof decoded.sub !== 'string') {
      const error = new Error('Unauthorized: Invalid token claims');
      error.status = 401;
      throw error;
    }
    return decoded.sub.toLowerCase();
  } catch (err) {
    const error = new Error('Unauthorized: Invalid or expired token');
    error.status = 401;
    throw error;
  }
}

module.exports = {
  signToken,
  requireAuth
};
