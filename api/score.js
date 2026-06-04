import { createClient } from '@supabase/supabase-js';
import { isValidSlug } from './_stalls.js';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
// Honest maxima: quiz = 5 × (10 + ⌊30/3⌋) = 100; wordsearch = 10×10 + ⌊300/10⌋ = 130.
// Capping at the real ceiling stops a forged score from out-ranking honest play.
const MAX_SCORE = { quiz: 100, wordsearch: 130 };
const ADMIN_USERNAME = 'admin';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { username, stall, game, score, fingerprint } = req.body ?? {};

  if (!username || typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  username = username.toLowerCase();
  if (!isValidSlug(stall)) {
    return res.status(400).json({ error: 'Invalid stall' });
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
  // The score must carry the device fingerprint that registered this player, so
  // a score can't be forged for someone else's username.
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Player must be registered for THIS stall, and the score must come from the
    // same device that registered (fingerprint match) before it counts.
    const { data: player } = await supabase
      .from('players')
      .select('id, fingerprint')
      .eq('username', username)
      .eq('stall', stall)
      .maybeSingle();

    if (!player) {
      return res.status(403).json({ error: 'Player not registered' });
    }
    if (player.fingerprint !== fingerprint) {
      return res.status(403).json({ error: 'Device mismatch' });
    }

    const { error } = await supabase.rpc('upsert_score_if_higher', {
      p_username: username,
      p_stall:    stall,
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
