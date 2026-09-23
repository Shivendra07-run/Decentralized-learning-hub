const crypto = require('crypto');
const { z } = require('zod');
const { verifyMessage } = require('ethers');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');
const { signToken, requireAuth } = require('../../lib/auth');

const VerifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required')
});

function send401(res) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 401;
  res.end(JSON.stringify({ error: 'Authentication failed' }));
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

  // 1. GET /api/auth/nonce
  if (subRoute === 'nonce') {
    if (req.method !== 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 30)) return;

    const nonce = crypto.randomBytes(16).toString('hex');
    const { error } = await supabase
      .from('auth_nonces')
      .insert([{
        nonce,
        used: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('[Nonce] Supabase insert error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to generate authentication nonce' }));
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ nonce }));
    return;
  }

  // 2. POST /api/auth/verify
  if (subRoute === 'verify') {
    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 20)) return;

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return send401(res);
      }
    }

    const parseResult = VerifySchema.safeParse(body);
    if (!parseResult.success) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid request payload' }));
      return;
    }

    const { address, message, signature } = parseResult.data;

    // Verify message template line-by-line
    const lines = message.replace(/\r\n/g, '\n').split('\n');
    if (lines.length !== 8) {
      return send401(res);
    }

    if (lines[0] !== 'Aether wants you to sign in with your Ethereum account:') {
      return send401(res);
    }

    const msgAddress = lines[1];
    if (!msgAddress || msgAddress.toLowerCase() !== address.toLowerCase()) {
      return send401(res);
    }

    if (lines[2] !== '') return send401(res);

    if (lines[3] !== 'Sign in to Aether. This does not cost gas and does not move funds.') {
      return send401(res);
    }

    if (lines[4] !== '') return send401(res);

    if (!lines[5].startsWith('URI: ')) return send401(res);
    const msgUri = lines[5].slice(5).trim();
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    if (allowedOrigin && allowedOrigin !== '*' && msgUri !== allowedOrigin) {
      return send401(res);
    }

    if (!lines[6].startsWith('Nonce: ')) return send401(res);
    const nonce = lines[6].slice(7).trim();
    if (!/^[a-fA-F0-9]{32}$/.test(nonce)) {
      return send401(res);
    }

    if (!lines[7].startsWith('Issued At: ')) return send401(res);
    const issuedAt = lines[7].slice(11).trim();

    // Confirm Issued At is within 5 minutes of server time
    const issuedTime = new Date(issuedAt).getTime();
    const now = Date.now();
    if (isNaN(issuedTime) || Math.abs(now - issuedTime) > 5 * 60 * 1000) {
      return send401(res);
    }

    // Confirm nonce exists in auth_nonces, is unused and < 5 minutes old
    const { data: nonceRow, error: nonceErr } = await supabase
      .from('auth_nonces')
      .select('*')
      .eq('nonce', nonce)
      .maybeSingle();

    if (nonceErr || !nonceRow || nonceRow.used) {
      return send401(res);
    }

    const nonceCreatedAt = new Date(nonceRow.created_at).getTime();
    if (isNaN(nonceCreatedAt) || Math.abs(now - nonceCreatedAt) > 5 * 60 * 1000) {
      return send401(res);
    }

    // Mark nonce used
    const { data: updatedNonce, error: updateErr } = await supabase
      .from('auth_nonces')
      .update({ used: true })
      .eq('nonce', nonce)
      .eq('used', false)
      .select();

    if (updateErr || !updatedNonce || updatedNonce.length === 0) {
      return send401(res);
    }

    // Recover address using ethers verifyMessage
    let recoveredAddress;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch (err) {
      return send401(res);
    }

    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return send401(res);
    }

    // Upsert user
    const normalizedAddress = address.toLowerCase();
    try {
      await supabase
        .from('users')
        .upsert({
          address: normalizedAddress,
          last_login: new Date().toISOString()
        }, { onConflict: 'address' });
    } catch (err) {
      console.warn('[Verify] Supabase upsert notice:', err);
    }

    const token = signToken(normalizedAddress);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      token,
      address: normalizedAddress
    }));
    return;
  }

  // 3. GET /api/auth/me
  if (subRoute === 'me') {
    if (req.method !== 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!checkRateLimit(req, res, 60)) return;

    const address = requireAuth(req);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ address }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Route not found' }));
});
