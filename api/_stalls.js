// Shared stall helpers for the API functions. The leading underscore keeps
// Vercel from exposing this as a route; it's import-only.

export const SLUG_RE = /^[a-z0-9-]{1,40}$/;

// Cheap format check — use before hitting the DB.
export function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

// Confirms a slug actually exists in the stalls table (use on writes).
export async function stallExists(supabase, slug) {
  if (!isValidSlug(slug)) return false;
  const { data } = await supabase
    .from('stalls')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  return !!data;
}
