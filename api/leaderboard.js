import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
      // Combined leaderboard: sum of both game scores per player
      supabase
        .from('scores')
        .select('email, score')
        .in('game', ['quiz', 'wordsearch']),
    ]);

    // Aggregate combined scores
    const totals = {};
    for (const row of totalResult.data ?? []) {
      totals[row.email] = (totals[row.email] || 0) + row.score;
    }
    const combined = Object.entries(totals)
      .map(([email, score]) => ({ email, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({
      quiz:        quizResult.data  ?? [],
      wordsearch:  wsResult.data    ?? [],
      combined,
      fetchedAt:   new Date().toISOString(),
    });
  } catch (err) {
    console.error('[leaderboard] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
