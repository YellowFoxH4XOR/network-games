import { createClient } from '@supabase/supabase-js';

// Public overall leaderboard: top 5 by combined score across all games,
// plus the requesting player's own rank. Exposes only username + score —
// never fingerprint or ip.
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const me = typeof req.query.username === 'string'
    ? req.query.username.toLowerCase()
    : '';

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: rows, error } = await supabase
      .from('scores')
      .select('username, score');
    if (error) throw error;

    // Sum every player's score across all games.
    const totals = {};
    for (const row of rows ?? []) {
      totals[row.username] = (totals[row.username] || 0) + row.score;
    }

    // Sort by score desc, then assign standard competition ranks (ties share a rank).
    const sorted = Object.entries(totals)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score);

    let rank = 0;
    let prevScore = null;
    const ranked = sorted.map((entry, i) => {
      if (entry.score !== prevScore) {
        rank = i + 1;
        prevScore = entry.score;
      }
      return { rank, username: entry.username, score: entry.score };
    });

    const top = ranked.slice(0, 5);
    const mine = me ? ranked.find(r => r.username === me) || null : null;

    return res.json({
      top,
      me: mine,
      totalPlayers: ranked.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[rankings] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
