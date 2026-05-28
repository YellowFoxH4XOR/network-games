import { createClient } from '@supabase/supabase-js';

// Username: 3-20 chars, letters, digits, underscore, hyphen, dot
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

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

  const { username, fingerprint } = req.body ?? {};

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  const ip = getClientIp(req);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('players')
      .insert({ username, fingerprint, ip });

    if (error) {
      if (error.code === '23505') {
        // Generic conflict — don't reveal which constraint failed
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
