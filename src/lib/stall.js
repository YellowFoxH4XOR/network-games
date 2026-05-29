// Client-side stall helpers: the active-stall cache (localStorage) plus the two
// network calls that gate entry — validate a code, and register for a stall.
// The server is the source of truth for codes; we only cache the resolved stall.

export function getActiveStall() {
  const slug = localStorage.getItem('sns_stall');
  if (!slug) return null;
  return { slug, name: localStorage.getItem('sns_stall_name') || slug };
}

export function setActiveStall(stall) {
  localStorage.setItem('sns_stall', stall.slug);
  localStorage.setItem('sns_stall_name', stall.name || stall.slug);
}

export function clearActiveStall() {
  localStorage.removeItem('sns_stall');
  localStorage.removeItem('sns_stall_name');
}

// POST /api/stall → { valid, stall?: { slug, name } }
export async function validateCode(code) {
  const res = await fetch('/api/stall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('unreachable');
  return res.json();
}

// POST /api/register for a specific stall.
// Returns { ok } or { ok:false, error, field } where field is 'username' | 'device'.
export async function registerForStall(username, fingerprint, slug) {
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username, fingerprint, stall: slug }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error, field: data.field };
  } catch {
    return { ok: false, error: 'unreachable' };
  }
}
