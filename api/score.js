import { createClient } from '@supabase/supabase-js';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
const MAX_SCORE = { quiz: 150, wordsearch: 200 };
const ADMIN_USERNAME = 'admin';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, game, score } = req.body ?? {};

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (!['quiz', 'wordsearch'].includes(game)) {
    return res.status(400).json({ error: 'Invalid game' });
  }
  const n = Number(score);
  if (!Number.isInteger(n) || n < 0 || n > MAX_SCORE[game]) {
    return res.status(400).json({ error: 'Score out of range' });
  }
  if (username === ADMIN_USERNAME) {
    return res.json({ ok: true, skipped: true });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (!player) {
      return res.status(403).json({ error: 'Player not registered' });
    }

    const { error } = await supabase.rpc('upsert_score_if_higher', {
      p_username: username,
      p_game:     game,
      p_score:    n,
    });

    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error('[score] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
