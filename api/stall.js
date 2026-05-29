import { createClient } from '@supabase/supabase-js';

// Validates a stall code server-side. Codes live in the `stalls` table so they
// can be changed without a redeploy. Returns the stall the code unlocks.
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

  let { code } = req.body ?? {};
  if (!code || typeof code !== 'string' || code.length > 64) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  // Codes are matched case-insensitively and trimmed so "stall1" == "STALL1 ".
  code = code.trim();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: stall, error } = await supabase
      .from('stalls')
      .select('slug, name')
      .ilike('code', code)
      .maybeSingle();
    if (error) throw error;

    if (!stall) return res.json({ valid: false });
    return res.json({ valid: true, stall: { slug: stall.slug, name: stall.name } });
  } catch (err) {
    console.error('[stall] error:', err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
}
