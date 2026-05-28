import { createClient } from '@supabase/supabase-js';

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma',        'no-cache');
  res.setHeader('Expires',       '0');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin',  origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  noCache(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { fingerprint, previousFingerprint } = req.body ?? {};
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }
  if (
    previousFingerprint &&
    (typeof previousFingerprint !== 'string' || previousFingerprint.length > 64)
  ) {
    return res.status(400).json({ error: 'Invalid previous fingerprint' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    let migrated = false;

    const { data: existingPlayer, error: existingError } = await supabase
      .from('players')
      .select('id, username')
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    if (existingError) throw existingError;

    let player = existingPlayer;

    if (!player && previousFingerprint && previousFingerprint !== fingerprint) {
      const { data: legacyPlayer, error: legacyError } = await supabase
        .from('players')
        .select('id, username')
        .eq('fingerprint', previousFingerprint)
        .maybeSingle();
      if (legacyError) throw legacyError;

      if (legacyPlayer) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ fingerprint })
          .eq('id', legacyPlayer.id);
        if (updateError) throw updateError;

        player = legacyPlayer;
        migrated = true;
      }
    }

    if (!player) {
      return res.json({ registered: false });
    }

    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('game, score')
      .eq('username', player.username);
    if (scoresError) throw scoresError;

    const out = {
      registered: true,
      username:   player.username,
      quiz:       null,
      wordsearch: null,
      migrated,
    };
    for (const s of (scores ?? [])) {
      if (s.game === 'quiz' || s.game === 'wordsearch') {
        out[s.game] = { score: s.score };
      }
    }
    return res.json(out);
  } catch (err) {
    console.error('[me] error:', err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
