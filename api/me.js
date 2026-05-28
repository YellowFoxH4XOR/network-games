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

  const { fingerprint } = req.body ?? {};
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: player } = await supabase
      .from('players')
      .select('id, username')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (!player) {
      return res.json({ registered: false });
    }

    const { data: scores } = await supabase
      .from('scores')
      .select('game, score')
      .eq('username', player.username);

    const out = {
      registered: true,
      username:   player.username,
      quiz:       null,
      wordsearch: null,
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
