import { createClient } from '@supabase/supabase-js';
import { buildBoards } from './_boards.js';

// Admin console data: the stalls (INCLUDING their entry codes — admin-only!),
// plus leaderboards scoped per stall and across all stalls.
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Bearer-token admin auth
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error('[leaderboard] ADMIN_SECRET env var not set');
    return res.status(503).json({ error: 'Admin not configured' });
  }
  if (!token || token !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const [stallsRes, scoresRes, playersRes] = await Promise.all([
      supabase.from('stalls').select('slug, name, code').order('slug'),
      supabase.from('scores').select('username, stall, game, score, created_at'),
      supabase.from('players').select('stall'),
    ]);
    if (stallsRes.error) throw stallsRes.error;
    if (scoresRes.error) throw scoresRes.error;
    if (playersRes.error) throw playersRes.error;

    const rows = scoresRes.data ?? [];
    const slugs = (stallsRes.data ?? []).map((s) => s.slug);

    // Registered-player count per stall, shown next to each code.
    const playerCounts = {};
    for (const p of playersRes.data ?? []) {
      playerCounts[p.stall] = (playerCounts[p.stall] || 0) + 1;
    }

    return res.json({
      stalls: (stallsRes.data ?? []).map((s) => ({
        slug: s.slug,
        name: s.name,
        code: s.code,
        players: playerCounts[s.slug] || 0,
      })),
      boards: buildBoards(rows, slugs),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[leaderboard] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
