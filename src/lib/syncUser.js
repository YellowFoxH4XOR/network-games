import { getFingerprint } from './fingerprint.js';

const ADMIN_USERNAME = 'admin';

function clearAllSns() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sns_'))
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

  // Player path: fingerprint → /api/me
  const fp = await getFingerprint();
  localStorage.setItem('sns_fp', fp);

  let data;
  try {
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ fingerprint: fp }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    data = await res.json();
  } catch {
    // API unreachable — fall back to local state without modifying it
    if (savedUser) return { kind: 'offline', username: savedUser };
    return { kind: 'offline' };
  }

  if (!data.registered) {
    // DB doesn't know this device — wipe stale state and start fresh
    clearAllSns();
    return { kind: 'fresh' };
  }

  // Sync: localStorage mirrors what the DB knows
  const u = data.username;
  localStorage.setItem('sns_user', u);

  if (data.quiz) {
    localStorage.setItem(`sns_${u}_quiz`, JSON.stringify({
      score: data.quiz.score, playedAt: Date.now(),
    }));
  } else {
    localStorage.removeItem(`sns_${u}_quiz`);
  }

  if (data.wordsearch) {
    localStorage.setItem(`sns_${u}_ws`, JSON.stringify({
      score: data.wordsearch.score, playedAt: Date.now(),
    }));
  } else {
    localStorage.removeItem(`sns_${u}_ws`);
  }

  return { kind: 'registered', username: u };
}

export function clearLocalSession() {
  clearAllSns();
}
