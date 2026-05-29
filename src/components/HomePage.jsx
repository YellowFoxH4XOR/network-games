import { useState } from 'react';

/* ── Modal to switch stalls by entering a new code ── */
function StallSwitcher({ current, onSubmit, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) { setError('Enter a stall code'); return; }
    setBusy(true); setError('');
    const r = await onSubmit(c);
    if (r?.error) { setError(r.error); setBusy(false); }
    // on success the parent navigates away, unmounting this modal
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'color-mix(in oklch, var(--ink) 38%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
        animation: 'fadeIn 0.2s var(--ease-out)',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="glass-strong"
        style={{ width: '100%', maxWidth: 360, padding: 22, animation: 'stampIn 0.4s var(--ease-spring)' }}
      >
        <div className="label" style={{ marginBottom: 6 }}>Switch stall</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>
          You’re in <strong style={{ color: 'var(--text)' }}>{current?.name || '—'}</strong>. Enter another
          stall’s code to load its games.
        </p>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder="STALL CODE"
          autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={32} autoFocus
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--bg2)', border: '1px solid var(--b2)', borderRadius: 0,
            fontSize: 16, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.12em', boxShadow: 'var(--shadow-sm)',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}>⚠ {error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 0, fontSize: 14, fontWeight: 700,
            background: 'var(--bg2)', border: '2px solid var(--ink)', color: 'var(--text2)', cursor: 'pointer',
          }}>Cancel</button>
          <button type="submit" disabled={busy} style={{
            flex: 1, padding: '12px', borderRadius: 0, fontSize: 14, fontWeight: 800,
            background: 'var(--green)', border: '2px solid var(--ink)', color: 'var(--ink)',
            boxShadow: 'var(--shadow-sm)', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
          }}>{busy ? 'Switching…' : 'Switch →'}</button>
        </div>
      </form>
    </div>
  );
}

const SECTIONS = [
  {
    id: 'landing',
    title: 'Games',
    desc: 'Two networking challenges — quiz & word search. One shot each.',
    accent: 'var(--green)',
    grad: 'var(--grad-green)',
    tag: '2 GAMES',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="6" width="20" height="14" rx="4" stroke="var(--green)" strokeWidth="1.6" />
        <path d="M8 11v4M6 13h4" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="17" cy="12" r="1.2" fill="var(--green)" />
        <circle cx="19.5" cy="15" r="1.2" fill="var(--green)" />
      </svg>
    ),
  },
  {
    id: 'visualize',
    title: 'Visualize',
    desc: 'Explore 3D switches, routers & load balancers. Tap ports to learn.',
    accent: 'var(--cyan)',
    grad: 'linear-gradient(135deg, var(--cyan), var(--blue))',
    tag: '3D · INTERACTIVE',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 3l9 5v10l-9 5-9-5V8l9-5z" stroke="var(--cyan)" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M13 3v10l9-5M13 13v10M13 13L4 8" stroke="var(--cyan)" strokeWidth="1.2" opacity="0.7" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HomePage({ username, stall, onSelect, onChangeStall }) {
  const [switching, setSwitching] = useState(false);
  return (
    <div className="screen" style={{ padding: '0 0 32px' }}>
      {switching && (
        <StallSwitcher
          current={stall}
          onSubmit={onChangeStall}
          onClose={() => setSwitching(false)}
        />
      )}
      {/* Header */}
      <div style={{
        padding: '18px 22px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeDown 0.5s var(--ease-out)',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <span className="grad-text">Network</span>{' '}
            <span style={{ color: 'var(--text)' }}>Challenge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' }}>
              @{username}
            </span>
            {stall && (
              <button
                onClick={() => setSwitching(true)}
                title="Change stall code"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 0, cursor: 'pointer',
                  background: 'var(--green-glow)', border: '1px solid color-mix(in oklch, var(--green) 35%, transparent)',
                }}
              >
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--green-dim)', letterSpacing: '0.08em' }}>
                  {stall.name.toUpperCase()}
                </span>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M11.5 6A4.5 4.5 0 103 9.5M11.5 2v4h-4" stroke="var(--green-dim)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => onSelect('leaderboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 0, cursor: 'pointer',
              background: 'var(--bg2)', border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 2h8v3a4 4 0 01-8 0V2z" stroke="var(--green)" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M11 3h1.5a1.5 1.5 0 01-1.5 2.5M3 3H1.5A1.5 1.5 0 003 5.5" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M7 9v2M5 12h4" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>RANKS</span>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', borderRadius: 0,
            background: 'var(--bg2)', border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
          }}>
            <span className="dot dot-g" style={{ width: 6, height: 6 }}></span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ padding: '24px 22px 14px', animation: 'fadeUp 0.5s var(--ease-out) 0.1s both' }}>
        <div className="divider">CHOOSE A SECTION</div>
      </div>

      {/* Section cards */}
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="tilt-card"
            style={{ cursor: 'pointer', animation: `fadeUp 0.6s var(--ease-out) ${0.18 + i * 0.08}s both` }}
          >
            <div style={{
              background: 'var(--bg2)',
              border: `2px solid ${s.accent}`,
              borderRadius: 0, overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ height: 3, background: s.grad }} />
              <div style={{ padding: '20px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 0, flexShrink: 0,
                  background: `color-mix(in oklch, ${s.accent} 12%, var(--bg2))`,
                  border: `1px solid color-mix(in oklch, ${s.accent} 22%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>{s.title}</span>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke={s.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 10 }}>{s.desc}</p>
                  <span className="tag tag-dim">{s.tag}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
