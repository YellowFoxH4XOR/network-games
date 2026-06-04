import { createClient } from '@supabase/supabase-js';
import { stallExists } from './_stalls.js';

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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { username, fingerprint, stall } = req.body ?? {};

  if (!username || typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  // Normalize to lowercase so 'Akki' and 'akki' are the same player
  username = username.toLowerCase();
  // 'admin' is reserved for the password-gated admin path — never a player.
  if (username === 'admin') {
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

    if (!(await stallExists(supabase, stall))) {
      return res.status(400).json({ error: 'Invalid stall' });
    }

    // Registration is scoped to the stall: a device/name can register once per
    // stall, so playing multiple stalls is allowed but each is one attempt.
    const { error } = await supabase
      .from('players')
      .insert({ username, fingerprint, ip, stall });

    if (error) {
      if (error.code === '23505') {
        // Surface which field collided (within this stall) so the client shows
        // the right message. uq_players_user_stall_ci → username; uq_players_fp_stall → device.
        const msg = error.message || '';
        const field = msg.includes('user_stall') || msg.includes('username') ? 'username' : 'device';
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
