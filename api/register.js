import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, fingerprint, ip } = req.body ?? {};
  if (!email || !fingerprint) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('players')
      .insert({ email, fingerprint, ip: ip || 'unknown' });

    if (error) {
      if (error.code === '23505') {
        const field = error.message.includes('email') ? 'email' : 'device';
        return res.status(409).json({ error: 'already_registered', field });
      }
      throw error;
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[register] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
