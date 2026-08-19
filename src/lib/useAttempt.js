import { useCallback, useEffect, useRef } from 'react';
import { saveScore } from './saveScore.js';
import { readJSON } from './storage.js';

/**
 * Ties a one-attempt game to a single play.
 *
 * Every game is "one attempt per challenge — scores are permanent", but that
 * only held for games played to the end: a player who walked out mid-round left
 * nothing behind, so the landing page offered them a fresh board and they could
 * keep restarting until they liked their score.
 *
 * So the attempt is claimed the moment the game opens, and finalised with
 * whatever had been earned when the player leaves. Coming back finds the game
 * already played, not a new one.
 *
 * @param key       localStorage key this game caches its result under
 * @param username  player name, for the score POST
 * @param stall     stall slug, for the score POST
 * @param game      game id, for the score POST
 * @param score     the live score; read at unmount to finalise an abandoned run
 * @param active    false once the game is over, or when it was already played —
 *                  nothing is claimed and leaving is not treated as abandoning
 */
export function useAttempt({ key, username, stall, game, score, active }) {
  // The cleanup below runs after the last render, so it needs the score through
  // a ref rather than the closure it was created in. Mirrored in an effect
  // rather than assigned during render, so the ref only ever holds a committed
  // value.
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);
  const savedRef = useRef(false);

  // Claim the attempt up front, so a reload or a walk-away can't undo it. The
  // real score overwrites this the moment the game ends, however it ends.
  useEffect(() => {
    if (!active || readJSON(key)) return;
    localStorage.setItem(key, JSON.stringify({
      score: 0, inProgress: true, playedAt: Date.now(),
    }));
  }, [key, active]);

  const write = useCallback((extra, scoreOverride) => {
    const finalScore = Math.max(0, scoreOverride ?? scoreRef.current ?? 0);
    localStorage.setItem(key, JSON.stringify({
      score: finalScore, playedAt: Date.now(), ...extra,
    }));
    saveScore(username, stall, game, finalScore);
  }, [key, username, stall, game]);

  /**
   * Record the game's real result. The first call wins, so a game with more
   * than one way to end (cleared board, expired clock) can call it from each.
   *
   * @param extra          per-game detail to store alongside the score
   * @param scoreOverride  final score when it isn't in state yet (a game that
   *                       computes a clamped total as it ends)
   */
  const save = useCallback((extra = {}, scoreOverride) => {
    if (savedRef.current) return;
    savedRef.current = true;
    write(extra, scoreOverride);
  }, [write]);

  /**
   * End an unfinished attempt at the score reached so far.
   *
   * Deliberately NOT one-shot. StrictMode mounts, tears down and remounts every
   * component in development, and that simulated teardown runs this cleanup —
   * with a one-shot guard it would bank a score of 0 before the player had
   * touched anything, and the real teardown later would be ignored. Overwriting
   * instead means the last teardown, the genuine one, is the one that counts.
   */
  const abandon = useCallback(() => {
    if (savedRef.current) return; // the game ended properly; that result stands
    write({ abandoned: true });
  }, [write]);

  // Leaving mid-game ends the attempt at whatever the player had earned.
  //
  // Deliberately an unmount-only effect: with `active` in the dependency list,
  // React runs the cleanup when the game merely *finishes* — writing an
  // "abandoned" record before the game's own save can record the real result,
  // and since the first save wins, that record is the one that sticks. Both
  // values are read through refs so the empty dependency list stays honest.
  const abandonRef = useRef(abandon);
  const activeRef = useRef(active);
  useEffect(() => { abandonRef.current = abandon; }, [abandon]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => () => {
    if (activeRef.current) abandonRef.current();
  }, []);

  return save;
}
