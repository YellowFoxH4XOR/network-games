import { createClient } from '@supabase/supabase-js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
// Generous upper bounds: quiz max ~100, wordsearch max ~130 (with full time bonus)
const MAX_SCORE = { quiz: 150, wordsearch: 200 };

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, game, score } = req.body ?? {};

  // Validate all fields server-side
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!['quiz', 'wordsearch'].includes(game)) {
    return res.status(400).json({ error: 'Invalid game' });
  }
  const n = Number(score);
  if (!Number.isInteger(n) || n < 0 || n > MAX_SCORE[game]) {
    return res.status(400).json({ error: 'Score out of range' });
  }
  if (email === 'admin@snsdays.com') {
    return res.json({ ok: true, skipped: true });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Verify this email is a registered player before accepting their score
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!player) {
      return res.status(403).json({ error: 'Player not registered' });
    }

    // Only keep the higher score if submitted twice (shouldn't happen, but guard it)
    const { error } = await supabase.rpc('upsert_score_if_higher', {
      p_email: email,
      p_game:  game,
      p_score: n,
    });

    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error('[score] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
