const { handler } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/ratelimit');
const { supabase } = require('../../lib/supabase');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!checkRateLimit(req, res, 60)) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('compare_rows')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[Compare Rows] Supabase query error:', error.message);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to fetch comparison rows' }));
      return;
    }

    const rows = (data || []).map((row) => ({
      id: row.id,
      topic: row.topic || row.title,
      web2: {
        title: row.web2?.title || row.web2_title || row.web2?.badge || '',
        text: row.web2?.text || row.web2_text || row.web2?.desc || ''
      },
      web3: {
        title: row.web3?.title || row.web3_title || row.web3?.badge || '',
        text: row.web3?.text || row.web3_text || row.web3?.desc || ''
      }
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(JSON.stringify(rows));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});
