const jwt = require('jsonwebtoken');
const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

const PROPOSAL_P1 = {
  id: 'p1',
  title: 'AIP-09: Allocate 25,000 AETH to Decentralized Security Auditing & Developer Guides',
  description: 'Allocate treasury resources to fund independent smart contract audits, security bounties, and zero-knowledge developer documentation.',
  created_at: '2026-09-01T00:00:00.000Z',
  closes_at: null
};

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 60)) return;

  // Check optional caller authentication
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
      } catch (e) {
        // Expired or invalid token, treat as unauthenticated
      }
    }
  }

  let votes = [];
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { data, error } = await supabase
        .from('dao_votes')
        .select('address, choice')
        .eq('proposal_id', 'p1');

      if (!error && Array.isArray(data)) {
        votes = data;
      }
    }
  } catch (err) {
    console.warn('[DAO Proposal] Query warning:', err.message);
  }

  let forCount = 0;
  let againstCount = 0;
  let abstainCount = 0;
  let callerChoice = null;

  for (const v of votes) {
    const choice = (v.choice || '').toLowerCase();
    if (choice === 'for' || choice === 'yes') forCount++;
    else if (choice === 'against' || choice === 'no') againstCount++;
    else if (choice === 'abstain') abstainCount++;

    if (callerAddress && v.address && v.address.toLowerCase() === callerAddress) {
      callerChoice = choice;
    }
  }

  const total = forCount + againstCount + abstainCount;

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    proposal: PROPOSAL_P1,
    counts: {
      for: forCount,
      against: againstCount,
      abstain: abstainCount,
      total: total
    },
    userChoice: callerChoice
  }));
});
