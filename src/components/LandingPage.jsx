import { useRef, useState } from 'react';
import { readJSON } from '../lib/storage.js';

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
    if (r?.error) { setError(r.error); setBusy(false); return; }
    // Close explicitly — the parent stays on the games screen after a switch,
    // so we can't rely on navigation to unmount this modal.
    onClose();
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

function TiltCard({ children, style, onClick, disabled }) {
  const ref = useRef(null);

  const onMove = (e) => {
    if (disabled) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateZ(4px)`;
  };
  const onLeave = () => {
    ref.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  return (
    <div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card"
      style={{ cursor: disabled ? 'default' : 'pointer', ...style }}
    >
      {children}
    </div>
  );
}

function ScoreBadge({ score, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      animation: 'popIn 0.5s var(--ease-spring)',
    }}>
      <span className="mono" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {score}
      </span>
      <span className="label" style={{ color, opacity: 0.7, marginTop: 2 }}>pts</span>
    </div>
  );
}

export default function LandingPage({ username, stall, onSelectGame, onChangeStall }) {
  const [switching, setSwitching] = useState(false);
  const slug     = stall?.slug || 'stall-1';
  const quizKey  = 'sns_' + username + '_' + slug + '_quiz';
  const wsKey    = 'sns_' + username + '_' + slug + '_ws';
  const quizData = readJSON(quizKey);
  const wsData   = readJSON(wsKey);
  const total    = (quizData?.score || 0) + (wsData?.score || 0);
  const bothDone = quizData && wsData;

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
            <span style={{ color: 'var(--text)' }}>Games</span>
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
            onClick={() => onSelectGame('leaderboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 0, cursor: 'pointer',
              background: 'var(--bg2)', border: '1px solid var(--b1)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 2h8v3a4 4 0 01-8 0V2z" stroke="var(--green)" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M11 3h1.5a1.5 1.5 0 01-1.5 2.5M3 3H1.5A1.5 1.5 0 003 5.5" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M7 9v2M5 12h4" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>RANKS</span>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', borderRadius: 0,
            background: 'var(--bg2)', border: '1px solid var(--b1)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span className="dot dot-g" style={{ width: 6, height: 6 }}></span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Score summary */}
      {(quizData || wsData) && (
        <div style={{ padding: '18px 22px 0', animation: 'fadeUp 0.5s var(--ease-out) 0.08s both' }}>
          <div className="grad-border">
            <div style={{ background: 'var(--bg2)', borderRadius: 0.5, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="label">Total Score</span>
                  <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, marginTop: 4 }} className="grad-text">
                    {total}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  {[
                    { label: 'QUIZ',   done: !!quizData, score: quizData?.score, color: 'var(--green)' },
                    { label: 'SEARCH', done: !!wsData,   score: wsData?.score,   color: 'var(--cyan)' },
                  ].map(({ label, done, score, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: done ? color : 'var(--text4)',
                        boxShadow: done ? `0 0 10px ${color}` : 'none',
                        display: 'block', margin: '0 auto 5px',
                        transition: 'all 0.3s',
                      }}/>
                      <span className="label" style={{ fontSize: 9 }}>{label}</span>
                      {done && <div className="mono" style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}>{score}</div>}
                    </div>
                  ))}
                </div>
              </div>
              {bothDone && (
                <div style={{
                  marginTop: 14, padding: '9px 14px',
                  background: 'var(--green-glow)', borderRadius: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: '1px solid color-mix(in oklch, var(--green) 22%, transparent)',
                  animation: 'fadeIn 0.5s ease',
                }}>
                  <span className="led-pulse"/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dim)', letterSpacing: '0.02em' }}>
                    All challenges completed
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ padding: '24px 22px 14px', animation: 'fadeUp 0.5s var(--ease-out) 0.12s both' }}>
        <div className="divider">SELECT A CHALLENGE</div>
      </div>

      {/* Cards */}
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quiz */}
        <TiltCard
          disabled={!!quizData}
          onClick={() => onSelectGame('quiz')}
          style={{ animation: 'fadeUp 0.6s var(--ease-out) 0.18s both' }}
        >
          <div style={{
            background: 'var(--bg2)',
            border: `2px solid ${quizData ? 'var(--ink)' : 'var(--green)'}`,
            borderRadius: 0, overflow: 'hidden',
            boxShadow: quizData ? 'var(--shadow-sm)' : 'var(--shadow)',
            opacity: quizData ? 0.62 : 1,
            transition: 'opacity 0.3s, box-shadow 0.3s',
          }}>
            {!quizData && <div style={{ height: 3, background: 'var(--grad-green)' }} />}

            <div style={{ padding: '20px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 0, flexShrink: 0,
                  background: quizData ? 'var(--s2)' : 'var(--success-soft)',
                  border: `1px solid ${quizData ? 'var(--b1)' : 'color-mix(in oklch, var(--green) 22%, transparent)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="11" stroke={quizData ? 'var(--text4)' : 'var(--green)'} strokeWidth="1.6"/>
                    <path d="M10.5 10.2C10.5 8.8 11.6 7.7 13 7.7s2.5 1.1 2.5 2.5c0 1.5-1.5 2.2-2.5 3.3" stroke={quizData ? 'var(--text4)' : 'var(--green)'} strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="13" cy="17.5" r="1.2" fill={quizData ? 'var(--text4)' : 'var(--green)'}/>
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: quizData ? 'var(--text2)' : 'var(--text)' }}>
                      Network Quiz
                    </span>
                    {quizData
                      ? <ScoreBadge score={quizData.score} color="var(--green)" />
                      : <span className="dot dot-a" style={{ width: 10, height: 10 }}></span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 12 }}>
                    5 random questions on protocols, ports &amp; OSI fundamentals.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag tag-dim">5 MCQ</span>
                    <span className="tag tag-dim">30s / Q</span>
                    <span className="tag tag-dim">Time Bonus</span>
                    {quizData && <span className="tag tag-green">✓ DONE</span>}
                  </div>
                </div>
              </div>
            </div>

            {!quizData && (
              <div style={{
                padding: '11px 20px', borderTop: '1px solid color-mix(in oklch, var(--green) 12%, transparent)',
                background: 'color-mix(in oklch, var(--green) 5%, var(--bg2))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--green-dim)', fontWeight: 800, letterSpacing: '0.1em' }}>PLAY NOW</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </TiltCard>

        {/* Word Search */}
        <TiltCard
          disabled={!!wsData}
          onClick={() => onSelectGame('wordsearch')}
          style={{ animation: 'fadeUp 0.6s var(--ease-out) 0.26s both' }}
        >
          <div style={{
            background: 'var(--bg2)',
            border: `2px solid ${wsData ? 'var(--ink)' : 'var(--cyan)'}`,
            borderRadius: 0, overflow: 'hidden',
            boxShadow: wsData ? 'var(--shadow-sm)' : 'var(--shadow)',
            opacity: wsData ? 0.62 : 1,
            transition: 'opacity 0.3s, box-shadow 0.3s',
          }}>
            {!wsData && <div style={{ height: 3, background: 'linear-gradient(135deg, var(--cyan), var(--blue))' }} />}

            <div style={{ padding: '20px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 0, flexShrink: 0,
                  background: wsData ? 'var(--s2)' : 'var(--cyan-glow)',
                  border: `1px solid ${wsData ? 'var(--b1)' : 'color-mix(in oklch, var(--cyan) 22%, transparent)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <rect x="3" y="3" width="20" height="20" rx="5" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="1.6"/>
                    <line x1="3" y1="10" x2="23" y2="10" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="3" y1="16" x2="23" y2="16" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="10" y1="3" x2="10" y2="23" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="16" y1="3" x2="16" y2="23" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="5" y1="7" x2="21" y2="21" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: wsData ? 'var(--text2)' : 'var(--text)' }}>
                      Word Search
                    </span>
                    {wsData
                      ? <ScoreBadge score={wsData.score} color="var(--cyan)" />
                      : <span className="dot dot-a" style={{ width: 10, height: 10 }}></span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 12 }}>
                    Find 10 networking terms hidden in a 10 × 10 grid. Any direction.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag tag-dim">10 × 10</span>
                    <span className="tag tag-dim">5 MIN</span>
                    <span className="tag tag-dim">All Directions</span>
                    {wsData && <span className="tag tag-cyan">✓ DONE</span>}
                  </div>
                </div>
              </div>
            </div>

            {!wsData && (
              <div style={{
                padding: '11px 20px', borderTop: '1px solid color-mix(in oklch, var(--cyan) 12%, transparent)',
                background: 'color-mix(in oklch, var(--cyan) 5%, var(--bg2))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.1em' }}>PLAY NOW</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </TiltCard>
      </div>

      <div className="mono" style={{
        textAlign: 'center', fontSize: 10, color: 'var(--text4)',
        padding: '24px 22px 0', letterSpacing: '0.08em', lineHeight: 1.8,
        animation: 'fadeIn 0.6s ease 0.4s both',
      }}>
        50 NETWORKING KEYWORDS · RANDOMLY GENERATED<br/>
        ONE ATTEMPT PER CHALLENGE · SCORES ARE PERMANENT
      </div>
    </div>
  );
}
