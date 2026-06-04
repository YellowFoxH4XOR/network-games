import { createClient } from '@supabase/supabase-js';
import { generateUniqueCodes } from './_codes.js';

// Admin-only: regenerate every stall's entry code in one shot. Takes effect
// immediately — players already inside a stall keep playing (the code only
// gates entry/switching), but anyone joining must use the new codes.
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Same Bearer-token admin auth as /api/leaderboard.
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error('[shuffle-codes] ADMIN_SECRET env var not set');
    return res.status(503).json({ error: 'Admin not configured' });
  }
  if (!token || token !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: stalls, error } = await supabase
      .from('stalls')
      .select('slug, name')
      .order('slug');
    if (error) throw error;
    if (!stalls || stalls.length === 0) {
      return res.status(404).json({ error: 'No stalls found' });
    }

    const codes = generateUniqueCodes(stalls.map((s) => s.slug));

    // Three tiny updates — fine at this scale, and each is atomic. The unique
    // index on stalls.code backstops any freak collision with a loud failure.
    for (const stall of stalls) {
      const { error: updateError } = await supabase
        .from('stalls')
        .update({ code: codes[stall.slug] })
        .eq('slug', stall.slug);
      if (updateError) throw updateError;
    }

    return res.json({
      ok: true,
      stalls: stalls.map((s) => ({ slug: s.slug, name: s.name, code: codes[s.slug] })),
    });
  } catch (err) {
    console.error('[shuffle-codes] error:', err.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
