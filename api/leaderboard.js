import { createClient } from '@supabase/supabase-js';

function maskEmail(email) {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${user[1]}${'*'.repeat(Math.min(user.length - 2, 4))}@${domain}`;
}

export default async function handler(req, res) {
  // Scope CORS to same origin only
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // ── Admin auth: require Bearer token matching ADMIN_SECRET env var ──
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
        .select('email, score, created_at')
        .eq('game', 'quiz')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10),
      supabase
        .from('scores')
        .select('email, score, created_at')
        .eq('game', 'wordsearch')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10),
      supabase
        .from('scores')
        .select('email, score'),
    ]);

    // Aggregate combined scores per player
    const totals = {};
    for (const row of totalResult.data ?? []) {
      totals[row.email] = (totals[row.email] || 0) + row.score;
    }
    const combined = Object.entries(totals)
      .map(([email, score]) => ({ email, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Mask all emails server-side before sending
    const mask = rows => (rows ?? []).map(r => ({ ...r, email: maskEmail(r.email) }));

    return res.json({
      quiz:       mask(quizResult.data),
      wordsearch: mask(wsResult.data),
      combined:   mask(combined),
      fetchedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[leaderboard] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
