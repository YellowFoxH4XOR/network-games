import { createClient } from '@supabase/supabase-js';
import { isValidSlug } from './_stalls.js';

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

    // One attempt per stall, per device. IP is NOT checked any more: at a venue
    // everyone shares one Wi-Fi NAT IP, so an IP lock would block every visitor
    // after the first. Device fingerprint scoped to the stall is the gate.
    const { data: byFp } = await supabase
      .from('players')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('stall', stall)
      .maybeSingle();

    if (byFp) return res.json({ allowed: false, reason: 'device_registered' });
    return res.json({ allowed: true });
  } catch (err) {
    console.error('[check] error:', err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
