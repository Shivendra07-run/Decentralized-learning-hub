const { z } = require('zod');
const { handler } = require('../../lib/cors');
const { requireAuth } = require('../../lib/auth');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

const VoteSchema = z.object({
  proposalId: z.string().default('p1'),
  choice: z.enum(['for', 'against', 'abstain'])
});

async function getProposalCounts(proposalId) {
  let forCount = 0;
  let againstCount = 0;
  let abstainCount = 0;

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { data, error } = await supabase
        .from('dao_votes')
        .select('choice')
        .eq('proposal_id', proposalId);

      if (!error && Array.isArray(data)) {
        for (const v of data) {
          const c = (v.choice || '').toLowerCase();
          if (c === 'for' || c === 'yes') forCount++;
          else if (c === 'against' || c === 'no') againstCount++;
          else if (c === 'abstain') abstainCount++;
        }
      }
    }
  } catch (err) {
    console.warn('[DAO Vote Counts] Warning:', err.message);
  }

  return {
    for: forCount,
    against: againstCount,
    abstain: abstainCount,
    total: forCount + againstCount + abstainCount
  };
}

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 20)) return;

  const address = requireAuth(req);

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

  const parseResult = VoteSchema.safeParse(body);
  if (!parseResult.success) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: parseResult.error.issues[0]?.message || 'Invalid vote payload' }));
    return;
  }

  const { proposalId, choice } = parseResult.data;

  // Upsert vote for address (allows changing vote)
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { error: upsertErr } = await supabase
        .from('dao_votes')
        .upsert({
          proposal_id: proposalId,
          address: address.toLowerCase(),
          choice: choice,
          updated_at: new Date().toISOString()
        }, { onConflict: 'proposal_id,address' });

      if (upsertErr) {
        console.warn('[DAO Vote] Upsert warning:', upsertErr.message);
      }
    }
  } catch (err) {
    console.warn('[DAO Vote] Error:', err.message);
  }

  const counts = await getProposalCounts(proposalId);

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    proposalId,
    userChoice: choice,
    counts
  }));
});
