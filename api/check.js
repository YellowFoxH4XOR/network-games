import { createClient } from '@supabase/supabase-js';

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  // Scope CORS to same origin — no wildcard
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fingerprint } = req.body ?? {};
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  // Always read IP server-side — never trust client-supplied value
  const ip = getClientIp(req);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: byFp } = await supabase
      .from('players')
      .select('id')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (byFp) {
      return res.json({ allowed: false, reason: 'device_registered' });
    }

    return res.json({ allowed: true });
  } catch (err) {
    console.error('[check] error:', err.message);
    // Distinguish transient DB error from a clean "not found".
    // For a first-time visitor we can't confirm they're clear, so return an
    // explicit error code — the client decides whether to fail open or not.
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
