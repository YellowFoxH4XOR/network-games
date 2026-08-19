import { getFingerprint } from './fingerprint.js';
import { GAME_KEY_SUFFIX, gameStorageKey } from '../data.js';

const ADMIN_USERNAME = 'admin';

function clearAllSns() {
  Object.keys(localStorage)
    // Keep sns_fp: it's the device identity. Wiping it would regenerate the
    // fingerprint on next visit, defeating the one-attempt-per-device gate.
    .filter(k => k.startsWith('sns_') && k !== 'sns_fp')
    .forEach(k => localStorage.removeItem(k));
  sessionStorage.removeItem('sns_admin_token');
}

/**
 * Reconciles client state with the database on app boot.
 * The DB is the source of truth — localStorage is a derived cache.
 *
 * Returns one of:
 *   { kind: 'admin' }                     — admin session valid
 *   { kind: 'registered', username }      — device known, scores synced into localStorage
 *   { kind: 'fresh' }                     — device unknown, stale state wiped
 *   { kind: 'offline', username? }        — API unreachable, falls back to whatever is in localStorage
 */
export async function syncUser() {
  const savedUser  = localStorage.getItem('sns_user') || '';
  const adminToken = sessionStorage.getItem('sns_admin_token') || '';

  // Admin path: verify the token still works against the live API
  if (savedUser === ADMIN_USERNAME && adminToken) {
    try {
      const res = await fetch('/api/leaderboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: 'no-store',
      });
      if (res.ok) return { kind: 'admin' };
      // Token rejected — fall through and clear
    } catch {
      // Network error — keep admin session optimistically
      return { kind: 'admin' };
    }
  }

  // Player path needs a chosen stall. Without one, the user must enter a code.
  const stall = localStorage.getItem('sns_stall') || '';
  const stallName = localStorage.getItem('sns_stall_name') || '';
  if (!stall) return { kind: 'fresh' };

  // fingerprint + stall → /api/me  (getFingerprint already persists sns_fp)
  const fp = await getFingerprint();

  let data;
  try {
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ fingerprint: fp, stall }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    data = await res.json();
  } catch {
    // API unreachable — fall back to local state without modifying it
    if (savedUser) return { kind: 'offline', username: savedUser, stall, stallName };
    return { kind: 'offline' };
  }

  if (!data.registered) {
    // Device isn't registered for THIS stall. Keep any other-stall caches; the
    // user just needs to (re)enter a code. Don't nuke everything.
    return { kind: 'fresh' };
  }

  // Sync: localStorage mirrors what the DB knows for this stall (keys namespaced by stall).
  const u = data.username;
  localStorage.setItem('sns_user', u);

  // Every game, not just the original two: a game missing here keeps no cache
  // entry after a sync, so its one-attempt gate silently re-opens and the player
  // can replay it until the stored score ratchets up.
  for (const game of Object.keys(GAME_KEY_SUFFIX)) {
    const cacheKey = gameStorageKey(u, stall, game);
    if (data[game]) {
      localStorage.setItem(cacheKey, JSON.stringify({
        score: data[game].score, playedAt: Date.now(),
      }));
    } else {
      localStorage.removeItem(cacheKey);
    }
  }

  return { kind: 'registered', username: u, stall, stallName };
}

export function clearLocalSession() {
  clearAllSns();
}
