import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fingerprint, ip } = req.body ?? {};
  if (!fingerprint) return res.status(400).json({ error: 'Missing fingerprint' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check fingerprint (primary device identity)
    const { data: byFp } = await supabase
      .from('players')
      .select('id, email')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (byFp) {
      return res.json({ allowed: false, reason: 'device_registered' });
    }

    // Soft IP check: warn if this IP has already submitted (shared WiFi guard — informational only)
    if (ip && ip !== 'unavailable') {
      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip);

      if (count > 0) {
        // IP seen before but different device — allow through, log the count
        return res.json({ allowed: true, ipWarning: true, ipCount: count });
      }
    }

    return res.json({ allowed: true });
  } catch (err) {
    console.error('[check] error:', err.message);
    // Fail open — never block users because the backend is down
    return res.json({ allowed: true });
  }
}
