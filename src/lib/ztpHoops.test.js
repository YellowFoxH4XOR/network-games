import { describe, it, expect } from 'vitest';
import { hoopIndexAt, HOOP_RIM_RATIO, HOOP_COUNT } from './ztpHoops.js';

const COURT = 800;                 // arbitrary court width
const HOOP = COURT / HOOP_COUNT;   // one hoop column
const centerOf = (idx) => idx * HOOP + HOOP / 2;
const everyX = (width, step = 2) =>
  Array.from({ length: Math.floor(width / step) + 1 }, (_, i) => i * step);

describe('hoopIndexAt', () => {
  it('drops the ball into the hoop it lands on', () => {
    for (let idx = 0; idx < HOOP_COUNT; idx++) {
      expect(hoopIndexAt(centerOf(idx), COURT)).toBe(idx);
    }
  });

  it('returns null for a shot that lands between two hoops', () => {
    // Regression: rims used to span 0.55 of a column each, covering ~110% of the
    // court, so no shot could ever miss and every stray one drew a penalty.
    const seam = (centerOf(0) + centerOf(1)) / 2;
    expect(hoopIndexAt(seam, COURT)).toBeNull();
  });

  it('never credits a shot to a hoop that is not the nearest one', () => {
    // Regression: overlapping windows were resolved by "last match wins", so a
    // shot inside the correct hoop's rim could be scored against its neighbour.
    for (const x of everyX(COURT)) {
      const hit = hoopIndexAt(x, COURT);
      if (hit === null) continue;
      const nearest = Array.from({ length: HOOP_COUNT }, (_, i) => i).reduce((a, b) =>
        Math.abs(x - centerOf(b)) < Math.abs(x - centerOf(a)) ? b : a,
      );
      expect(hit, `shot at ${x} credited to the wrong hoop`).toBe(nearest);
    }
  });

  it('leaves a real gap between adjacent rims, so an airball is reachable', () => {
    expect(HOOP_RIM_RATIO).toBeLessThan(0.5);
    const missed = everyX(COURT).filter((x) => hoopIndexAt(x, COURT) === null);
    expect(missed.length).toBeGreaterThan(0);
  });

  it('rims never overlap: no landing point is inside two hoops at once', () => {
    for (const x of everyX(COURT)) {
      const inRange = Array.from({ length: HOOP_COUNT }, (_, i) => i).filter(
        (idx) => Math.abs(x - centerOf(idx)) <= HOOP * HOOP_RIM_RATIO,
      );
      expect(inRange.length, `x=${x} sits inside ${inRange.length} rims`).toBeLessThanOrEqual(1);
    }
  });

  it('scales with the court, so the geometry holds on a phone too', () => {
    const narrow = 320;
    const narrowHoop = narrow / HOOP_COUNT;
    expect(hoopIndexAt(narrowHoop / 2, narrow)).toBe(0);
    expect(hoopIndexAt(narrowHoop, narrow)).toBeNull(); // seam between hoops 0 and 1
  });
});
