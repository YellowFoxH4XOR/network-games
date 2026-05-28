import { createClient } from '@supabase/supabase-js';

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

  const { fingerprint } = req.body ?? {};
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length > 64) {
    return res.status(400).json({ error: 'Invalid fingerprint' });
  }

  // IP is always read server-side — never trust the client
  const ip = getClientIp(req);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Block if this device fingerprint OR this IP has already played
    const [{ data: byFp }, { data: byIp }] = await Promise.all([
      supabase.from('players').select('id').eq('fingerprint', fingerprint).maybeSingle(),
      supabase.from('players').select('id').eq('ip', ip).maybeSingle(),
    ]);

    if (byFp) return res.json({ allowed: false, reason: 'device_registered' });
    if (byIp) return res.json({ allowed: false, reason: 'ip_registered' });

    return res.json({ allowed: true });
  } catch (err) {
    console.error('[check] error:', err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
