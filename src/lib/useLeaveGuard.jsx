import { useState } from 'react';
import LeaveGuard from '../components/LeaveGuard.jsx';

/**
 * Guards the Back button while a game is in progress.
 *
 * Leaving now ends the attempt (see useAttempt), so it should never happen on a
 * stray tap — the player is asked to confirm first. Once the game is over, Back
 * is ordinary navigation again and goes straight through.
 *
 * @param onBack      the real navigation callback
 * @param active      true only while a game is actually in progress
 * @param beforeLeave finalises the attempt; run before navigating, because the
 *                    screen behind reads the stored result as it renders, and
 *                    React runs an unmount cleanup only after that render — so
 *                    leaving it to the cleanup shows the player a stale score
 *                    until something re-renders the page.
 * @returns [guardedBack, dialog] — render `dialog` anywhere in the screen
 */
export function useLeaveGuard(onBack, active, beforeLeave) {
  const [asking, setAsking] = useState(false);
  const guardedBack = active ? () => setAsking(true) : onBack;
  const leave = () => {
    beforeLeave?.();
    onBack();
  };
  const dialog = asking
    ? <LeaveGuard onStay={() => setAsking(false)} onLeave={leave} />
    : null;
  return [guardedBack, dialog];
}
