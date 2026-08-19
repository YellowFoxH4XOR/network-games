/* ── Confirmation shown before leaving a game in progress ──
   Leaving ends the attempt (see src/lib/useAttempt.js), so it must never happen
   on a stray tap — the player is told what it costs first. Driven by
   useLeaveGuard. ── */
export default function LeaveGuard({ onStay, onLeave }) {
  return (
    <div
      onClick={onStay}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'color-mix(in oklch, var(--ink) 62%, transparent)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
        animation: 'fadeIn 0.2s var(--ease-out)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-strong"
        style={{ width: '100%', maxWidth: 340, padding: 22, animation: 'stampIn 0.4s var(--ease-spring)' }}
      >
        <div className="label" style={{ marginBottom: 8, color: 'var(--amber)' }}>Leave this challenge?</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 16 }}>
          You get one attempt. If you leave now, the points you’ve earned so far
          become your final score — you can’t play this challenge again.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onStay} style={{
            flex: 1, padding: '12px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700,
            background: 'var(--grad-green)', border: 'none', color: 'var(--on-accent)',
            boxShadow: '0 8px 24px -8px var(--green-glow2)', cursor: 'pointer',
          }}>Keep playing</button>
          <button onClick={onLeave} style={{
            flex: 1, padding: '12px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600,
            background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--text2)', cursor: 'pointer',
          }}>Leave</button>
        </div>
      </div>
    </div>
  );
}
