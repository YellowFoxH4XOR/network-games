// JSON.parse that never throws. A corrupt or half-written localStorage value
// would otherwise raise during render and white-screen a player mid-event — this
// returns the fallback instead. Use it everywhere we read cached JSON.
export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
