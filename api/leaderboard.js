import { createClient } from '@supabase/supabase-js';

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

    const [quizResult, wsResult, totalResult] = await Promise.all([
      supabase
        .from('scores')
        .select('username, score, created_at')
        .eq('game', 'quiz')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10),
      supabase
        .from('scores')
        .select('username, score, created_at')
        .eq('game', 'wordsearch')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10),
      supabase.from('scores').select('username, score'),
    ]);

    // Sum scores across both games for the combined board
    const totals = {};
    for (const row of totalResult.data ?? []) {
      totals[row.username] = (totals[row.username] || 0) + row.score;
    }
    const combined = Object.entries(totals)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({
      quiz:       quizResult.data ?? [],
      wordsearch: wsResult.data   ?? [],
      combined,
      fetchedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[leaderboard] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
