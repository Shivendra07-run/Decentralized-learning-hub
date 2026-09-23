const { z } = require('zod');
const { verifyMessage } = require('ethers');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');
const { signToken } = require('../../lib/auth');

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

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 20)) {
    return;
  }

  // Parse request body if needed
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

  // 1. Verify message matches exact template line-by-line
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

  if (lines[2] !== '') {
    return send401(res);
  }

  if (lines[3] !== 'Sign in to Aether. This does not cost gas and does not move funds.') {
    return send401(res);
  }

  if (lines[4] !== '') {
    return send401(res);
  }

  if (!lines[5].startsWith('URI: ')) {
    return send401(res);
  }
  const msgUri = lines[5].slice(5).trim();
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && allowedOrigin !== '*' && msgUri !== allowedOrigin) {
    return send401(res);
  }

  if (!lines[6].startsWith('Nonce: ')) {
    return send401(res);
  }
  const nonce = lines[6].slice(7).trim();
  if (!/^[a-fA-F0-9]{32}$/.test(nonce)) {
    return send401(res);
  }

  if (!lines[7].startsWith('Issued At: ')) {
    return send401(res);
  }
  const issuedAt = lines[7].slice(11).trim();

  // 2. Confirm Issued At is within 5 minutes of server time
  const issuedTime = new Date(issuedAt).getTime();
  const now = Date.now();
  if (isNaN(issuedTime) || Math.abs(now - issuedTime) > 5 * 60 * 1000) {
    return send401(res);
  }

  // 3. Confirm nonce exists in auth_nonces, is unused and < 5 minutes old
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

  // Mark nonce used (one-time atomic check)
  const { data: updatedNonce, error: updateErr } = await supabase
    .from('auth_nonces')
    .update({ used: true })
    .eq('nonce', nonce)
    .eq('used', false)
    .select();

  if (updateErr || !updatedNonce || updatedNonce.length === 0) {
    return send401(res);
  }

  // 4. Recover address using ethers verifyMessage and confirm equals given address
  let recoveredAddress;
  try {
    recoveredAddress = verifyMessage(message, signature);
  } catch (err) {
    return send401(res);
  }

  if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    return send401(res);
  }

  // 5. Upsert user (lowercase address) with last_login
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

  // Generate 12h Bearer JWT token
  const token = signToken(normalizedAddress);

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    token,
    address: normalizedAddress
  }));
});
