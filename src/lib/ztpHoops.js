// Where a ZTP Basketball shot lands. Pure geometry, kept out of the component
// so it can be tested directly (and so the component file keeps exporting only
// a component).

export const HOOP_COUNT = 4;

// Half-width of a hoop's rim, as a fraction of one hoop column. Must stay below
// 0.5: at 0.5 the rims tile the court edge to edge and an airball is impossible,
// and above it neighbouring rims overlap so one shot is "in" two hoops at once.
export const HOOP_RIM_RATIO = 0.35;

/**
 * Index of the hoop a shot landing at `targetX` drops into, or null for an
 * airball.
 *
 * The ball belongs to the hoop it is nearest, and only if it came down inside
 * that hoop's rim. Testing each hoop independently and keeping the last match
 * instead — as this originally did, with a 0.55 half-width — both makes every
 * shot a hit (the windows covered ~110% of the court, so the miss branch was
 * unreachable and every stray shot drew a penalty) and hands a shot in the
 * overlap to the higher-indexed hoop, turning a goal into a wrong-hoop penalty.
 */
export function hoopIndexAt(targetX, courtWidth) {
  const hoopWidth = courtWidth / HOOP_COUNT;
  let nearest = null;
  let bestDist = Infinity;

  for (let idx = 0; idx < HOOP_COUNT; idx++) {
    const hoopCenterX = idx * hoopWidth + hoopWidth / 2;
    const distX = Math.abs(targetX - hoopCenterX);
    if (distX < bestDist) {
      bestDist = distX;
      nearest = idx;
    }
  }

  return bestDist <= hoopWidth * HOOP_RIM_RATIO ? nearest : null;
}
