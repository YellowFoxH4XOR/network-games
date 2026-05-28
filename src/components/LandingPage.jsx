import { useRef } from 'react';

/* ── 3D Tilt card ── */
function TiltCard({ children, glowColor = 'rgba(0,255,135,0.12)', style, onClick, disabled }) {
  const ref = useRef(null);

  const onMove = (e) => {
    if (disabled) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) translateZ(6px)`;
    el.style.boxShadow = `0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)`;
  };

  const onLeave = () => {
    const el = ref.current;
    el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    el.style.boxShadow = '';
  };

  return (
    <div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card"
      style={{
        cursor: disabled ? 'default' : 'pointer',
        transition: 'transform 0.15s var(--ease-out), box-shadow 0.2s var(--ease-out)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Score badge ── */
function ScoreBadge({ score, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      animation: 'countUp 0.5s var(--ease-spring)',
    }}>
      <span className="mono" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</span>
      <span className="label" style={{ color, opacity: 0.7, marginTop: 2 }}>pts</span>
    </div>
  );
}

export default function LandingPage({ username, onSelectGame }) {
  const quizKey = 'sns_' + username + '_quiz';
  const wsKey   = 'sns_' + username + '_ws';
  const quizData = localStorage.getItem(quizKey) ? JSON.parse(localStorage.getItem(quizKey)) : null;
  const wsData   = localStorage.getItem(wsKey)   ? JSON.parse(localStorage.getItem(wsKey))   : null;
  const total    = (quizData?.score || 0) + (wsData?.score || 0);
  const bothDone = quizData && wsData;

  return (
    <div style={{ minHeight: '100dvh', padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '20px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeDown 0.5s var(--ease-out)',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <span className="grad-text">Network</span>{' '}
            <span style={{ color: 'var(--text)' }}>Games</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, letterSpacing: '0.04em' }}>
            @{username}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--s2)', borderRadius: 100, border: '1px solid var(--b1)' }}>
          <span className="dot dot-g" style={{ width: 6, height: 6 }}></span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>ONLINE</span>
        </div>
      </div>

      {/* ── Score summary ── */}
      {(quizData || wsData) && (
        <div style={{ padding: '20px 24px 0', animation: 'fadeUp 0.5s var(--ease-out) 0.1s both' }}>
          <div className="grad-border">
            <div style={{ background: 'var(--bg2)', borderRadius: 19, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="label">Total Score</span>
                  <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, marginTop: 4 }} className="grad-text">
                    {total}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  {[
                    { label: 'QUIZ',   done: !!quizData, score: quizData?.score, color: 'var(--green)' },
                    { label: 'SEARCH', done: !!wsData,   score: wsData?.score,   color: 'var(--cyan)' },
                  ].map(({ label, done, score, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <span
                        className="dot"
                        style={{
                          width: 10, height: 10,
                          background: done ? color : 'var(--text4)',
                          boxShadow: done ? `0 0 12px ${color}` : 'none',
                          display: 'block', margin: '0 auto 6px',
                          transition: 'all 0.3s',
                        }}
                      />
                      <span className="label" style={{ fontSize: 9 }}>{label}</span>
                      {done && <div className="mono" style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}>{score}</div>}
                    </div>
                  ))}
                </div>
              </div>
              {bothDone && (
                <div style={{ marginTop: 16, padding: '10px 16px', background: 'var(--green-glow)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(0,255,135,0.15)' }}>
                  <span className="dot dot-g" style={{ width: 8, height: 8, animation: 'glowPulse 2s ease infinite' }}></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>All challenges completed — great work</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ padding: '28px 24px 16px', animation: 'fadeUp 0.5s var(--ease-out) 0.15s both' }}>
        <div className="divider">SELECT A CHALLENGE</div>
      </div>

      {/* ── Game Cards ── */}
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Quiz card */}
        <TiltCard
          glowColor="rgba(0,255,135,0.12)"
          disabled={!!quizData}
          onClick={() => onSelectGame('quiz')}
          style={{ animation: 'fadeUp 0.6s var(--ease-out) 0.2s both' }}
        >
          <div style={{
            background: quizData ? 'var(--s1)' : 'var(--s2)',
            border: `1px solid ${quizData ? 'var(--b1)' : 'rgba(0,255,135,0.18)'}`,
            borderRadius: 20, overflow: 'hidden',
            opacity: quizData ? 0.5 : 1,
            transition: 'opacity 0.3s',
          }}>
            {/* Top accent line */}
            {!quizData && (
              <div style={{ height: 2, background: 'var(--grad-green)', opacity: 0.8 }} />
            )}

            <div style={{ padding: '22px 22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  background: quizData ? 'var(--s1)' : 'rgba(0,255,135,0.08)',
                  border: `1px solid ${quizData ? 'var(--b1)' : 'rgba(0,255,135,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: quizData ? 'none' : '0 0 20px rgba(0,255,135,0.08)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="11" stroke={quizData ? 'var(--text4)' : 'var(--green)'} strokeWidth="1.5"/>
                    <path d="M10.5 10.2C10.5 8.8 11.6 7.7 13 7.7s2.5 1.1 2.5 2.5c0 1.5-1.5 2.2-2.5 3.3" stroke={quizData ? 'var(--text4)' : 'var(--green)'} strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="13" cy="17.5" r="1" fill={quizData ? 'var(--text4)' : 'var(--green)'}/>
                  </svg>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: quizData ? 'var(--text3)' : 'var(--text)' }}>
                      Network Quiz
                    </span>
                    {quizData
                      ? <ScoreBadge score={quizData.score} color="var(--green)" />
                      : <span className="dot dot-a" style={{ width: 10, height: 10 }}></span>
                    }
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                    5 random questions on protocols, ports &amp; OSI fundamentals. 30s per question — time bonus applies.
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

            {/* Bottom CTA bar */}
            {!quizData && (
              <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(0,255,135,0.08)', background: 'rgba(0,255,135,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>PLAY NOW</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </TiltCard>

        {/* Word Search card */}
        <TiltCard
          glowColor="rgba(0,212,255,0.12)"
          disabled={!!wsData}
          onClick={() => onSelectGame('wordsearch')}
          style={{ animation: 'fadeUp 0.6s var(--ease-out) 0.3s both' }}
        >
          <div style={{
            background: wsData ? 'var(--s1)' : 'var(--s2)',
            border: `1px solid ${wsData ? 'var(--b1)' : 'rgba(0,212,255,0.18)'}`,
            borderRadius: 20, overflow: 'hidden',
            opacity: wsData ? 0.5 : 1,
            transition: 'opacity 0.3s',
          }}>
            {!wsData && (
              <div style={{ height: 2, background: 'linear-gradient(135deg, var(--cyan), var(--blue))', opacity: 0.8 }} />
            )}

            <div style={{ padding: '22px 22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  background: wsData ? 'var(--s1)' : 'rgba(0,212,255,0.08)',
                  border: `1px solid ${wsData ? 'var(--b1)' : 'rgba(0,212,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: wsData ? 'none' : '0 0 20px rgba(0,212,255,0.08)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <rect x="3" y="3" width="20" height="20" rx="5" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="1.5"/>
                    <line x1="3" y1="10" x2="23" y2="10" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="3" y1="16" x2="23" y2="16" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="10" y1="3" x2="10" y2="23" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="16" y1="3" x2="16" y2="23" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="0.6" opacity="0.4"/>
                    <line x1="5" y1="7" x2="21" y2="21" stroke={wsData ? 'var(--text4)' : 'var(--cyan)'} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: wsData ? 'var(--text3)' : 'var(--text)' }}>
                      Word Search
                    </span>
                    {wsData
                      ? <ScoreBadge score={wsData.score} color="var(--cyan)" />
                      : <span className="dot dot-a" style={{ width: 10, height: 10 }}></span>
                    }
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                    Find 10 networking terms hidden in a 12×12 grid. Search horizontally, vertically, and diagonally.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag tag-dim">12 × 12</span>
                    <span className="tag tag-dim">5 MIN</span>
                    <span className="tag tag-dim">All Directions</span>
                    {wsData && <span className="tag tag-cyan">✓ DONE</span>}
                  </div>
                </div>
              </div>
            </div>

            {!wsData && (
              <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,212,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.08em' }}>PLAY NOW</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </TiltCard>
      </div>

      {/* Footer note */}
      <div className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', padding: '28px 24px 0', letterSpacing: '0.08em', lineHeight: 1.8 }}>
        50 NETWORKING KEYWORDS · RANDOMLY GENERATED<br/>ONE ATTEMPT PER CHALLENGE · SCORES ARE PERMANENT
      </div>
    </div>
  );
}
