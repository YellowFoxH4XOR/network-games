import { createClient } from '@supabase/supabase-js';
import { isValidSlug } from './_stalls.js';

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

  const { fingerprint, stall } = req.body ?? {};
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }
  if (!isValidSlug(stall)) {
    return res.status(400).json({ error: 'Invalid stall' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Every stall this device has registered for. The username is stable across
    // a device's stalls, so any row gives it.
    const { data: rows, error: rowsError } = await supabase
      .from('players')
      .select('username, stall')
      .eq('fingerprint', fingerprint);
    if (rowsError) throw rowsError;

    if (!rows || rows.length === 0) {
      return res.json({ registered: false, knownDevice: false, playedStalls: [] });
    }

    const username = rows[0].username;
    const playedStalls = rows.map(r => r.stall);
    const registeredHere = playedStalls.includes(stall);

    const out = {
      registered:   registeredHere,   // registered for the requested stall?
      knownDevice:  true,             // this device is known (in some stall)
      username,
      playedStalls,
      quiz:         null,
      wordsearch:   null,
    };

    if (registeredHere) {
      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('game, score')
        .eq('username', username)
        .eq('stall', stall);
      if (scoresError) throw scoresError;
      for (const s of (scores ?? [])) {
        if (s.game === 'quiz' || s.game === 'wordsearch') {
          out[s.game] = { score: s.score };
        }
      }
    }

    return res.json(out);
  } catch (err) {
    console.error('[me] error:', err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
