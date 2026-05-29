import { createClient } from '@supabase/supabase-js';
import { isValidSlug } from './_stalls.js';

// Public leaderboard. Two modes:
//   mode=stall  → ranks players within one stall (sum of their games in that stall)
//   mode=overall→ ranks players across ALL stalls (sum of every score, by username)
// Exposes only username + score — never fingerprint or ip.
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

  const me = typeof req.query.username === 'string' ? req.query.username.toLowerCase() : '';
  const mode = req.query.mode === 'overall' ? 'overall' : 'stall';
  const stall = typeof req.query.stall === 'string' ? req.query.stall : '';

  if (mode === 'stall' && !isValidSlug(stall)) {
    return res.status(400).json({ error: 'Invalid stall' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    let query = supabase.from('scores').select('username, score, stall');
    if (mode === 'stall') query = query.eq('stall', stall);
    const { data: rows, error } = await query;
    if (error) throw error;

    // Sum every player's score (across games, and across stalls for overall mode).
    const totals = {};
    for (const row of rows ?? []) {
      totals[row.username] = (totals[row.username] || 0) + row.score;
    }

    // Sort desc, then standard competition ranks (ties share a rank).
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

    // Resolve the stall's display name for the UI header.
    let stallName = null;
    if (mode === 'stall') {
      const { data: s } = await supabase
        .from('stalls').select('name').eq('slug', stall).maybeSingle();
      stallName = s?.name ?? null;
    }

    return res.json({
      mode,
      stall: mode === 'stall' ? stall : null,
      stallName,
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
