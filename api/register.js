import { createClient } from '@supabase/supabase-js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, fingerprint } = req.body ?? {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  // Read IP server-side — never trust client-supplied value
  const ip = getClientIp(req);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('players')
      .insert({ email, fingerprint, ip });

    if (error) {
      if (error.code === '23505') {
        // Don't reveal which constraint failed — generic message only
        return res.status(409).json({ error: 'already_registered' });
      }
      throw error;
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[register] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
