import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, game, score } = req.body ?? {};
  if (!email || !game || score == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!['quiz', 'wordsearch'].includes(game)) {
    return res.status(400).json({ error: 'Invalid game' });
  }
  // Don't save scores for the admin account
  if (email === 'admin@snsdays.com') {
    return res.json({ ok: true, skipped: true });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('scores')
      .upsert({ email, game, score }, { onConflict: 'email,game' });

    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error('[score] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
