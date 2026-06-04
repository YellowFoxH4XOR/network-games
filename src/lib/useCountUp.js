import { useState, useRef, useEffect } from 'react';

/**
 * Smoothly animates a number from its previous value to `target` using a
 * cubic ease-out over `duration` ms (requestAnimationFrame-driven).
 *
 * Shared by the Quiz and WordSearch result screens so the score "ticks up"
 * the same way in both. Honours prefers-reduced-motion by snapping instantly.
 *
 * The current value is mirrored in a ref so the effect can read where the
 * animation is at without listing `value` as a dependency (which would restart
 * the animation on every frame). The effect therefore depends only on the
 * inputs, `target` and `duration`.
 */
export function useCountUp(target, duration = 400) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const startRef = useRef(target);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (target === valueRef.current) return;

    // Respect reduced-motion: snap to the final value on the next frame
    // (scheduled, not a synchronous in-effect setState).
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      rafRef.current = requestAnimationFrame(() => {
        valueRef.current = target;
        setValue(target);
      });
      return () => cancelAnimationFrame(rafRef.current);
    }

    startRef.current = valueRef.current;
    startTimeRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(startRef.current + (target - startRef.current) * eased);
      valueRef.current = v;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
