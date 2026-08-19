import { useState, useEffect, useRef } from 'react';
import { SPIN_TOPICS, spinQuestion } from '../data.js';
import TopBar from './TopBar.jsx';
import { useAttempt } from '../lib/useAttempt.js';
import { useLeaveGuard } from '../lib/useLeaveGuard.jsx';
import { useCountUp } from '../lib/useCountUp.js';
import { readJSON } from '../lib/storage.js';
import { quizPoints, SPIN_ROUNDS, SPIN_SECONDS_PER_Q } from '../lib/scoring.js';

const SPIN_MS = 3400; // wheel animation duration; keep in sync with the CSS transition below

// Segment colors cycle so neighbours never match (8 segments / 4 colors).
const SEG_COLORS = ['var(--green)', 'var(--cyan)', 'var(--amber)', 'var(--violet)'];

// Compact display labels that fit a 45° slice.
const WHEEL_LABELS = {
  'Load Balancers': 'LOAD BAL.',
  'Servers & LAN':  'SERVERS',
};
const segLabel = (t) => WHEEL_LABELS[t.label] || t.label.toUpperCase();

// Precomputed segment geometry: 0° at 12 o'clock, clockwise, one 45° slice per
// topic, segment i centred on angle i*45.
const CX = 140, CY = 140, R = 126, LABEL_R = 86;
const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};
const SEGMENTS = SPIN_TOPICS.map((topic, i) => {
  const from = i * 45 - 22.5;
  const to   = i * 45 + 22.5;
  const [x1, y1] = pt(from, R);
  const [x2, y2] = pt(to, R);
  const [lx, ly] = pt(i * 45, LABEL_R);
  const angle = i * 45;
  return {
    topic, i,
    d: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`,
    lx, ly,
    // Flip bottom-half labels 180° so they read upright rather than inverted.
    rotate: angle > 90 && angle < 270 ? angle + 180 : angle,
    color: SEG_COLORS[i % SEG_COLORS.length],
  };
});

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh', paddingBottom: 36 },
  backFull: {
    width: '100%', padding: '16px', background: 'var(--s2)',
    border: '1px solid var(--b1)', borderRadius: 'var(--r-md)',
    color: 'var(--text2)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

/* ── Round progress node: earned points per finished spin ── */
function RoundNode({ index, current, answer }) {
  const past = index < current;
  const active = index === current;
  const good = past && answer?.pts > 0;
  return (
    <div style={{
      width: 40, height: 32, borderRadius: 'var(--r-xs)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--s3)' : past ? (good ? 'var(--success-soft)' : 'var(--danger-soft)') : 'var(--s1)',
      border: `1.5px solid ${active ? 'var(--b3)' : past ? (good ? 'color-mix(in oklch, var(--green) 30%, transparent)' : 'color-mix(in oklch, var(--red) 30%, transparent)') : 'var(--b1)'}`,
      boxShadow: active ? 'var(--shadow-sm)' : good ? '0 0 12px var(--green-glow)' : 'none',
      transition: 'all 0.3s var(--ease-out)',
    }}>
      {past
        ? <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: good ? 'var(--green)' : 'var(--red)' }}>+{answer.pts}</span>
        : <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--text)' : 'var(--text4)' }}>{index + 1}</span>}
    </div>
  );
}

/* ── The wheel itself. `rotation` accumulates so every spin turns clockwise. ── */
function Wheel({ rotation, spinning, landed }) {
  return (
    <div style={{ position: 'relative', width: 'min(78vw, 300px)', margin: '0 auto' }}>
      {/* Pointer */}
      <div style={{
        position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        filter: 'drop-shadow(0 0 8px var(--amber))',
      }}>
        <svg width="26" height="22" viewBox="0 0 26 22">
          <path d="M13 22L2 0h22L13 22z" fill="var(--amber)"/>
        </svg>
      </div>
      <svg
        viewBox="0 0 280 280"
        style={{
          width: '100%', display: 'block',
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${SPIN_MS / 1000}s cubic-bezier(0.12, 0.72, 0.16, 1)` : 'none',
          filter: 'drop-shadow(0 0 26px color-mix(in oklch, var(--amber) 18%, transparent))',
        }}
      >
        <circle cx={CX} cy={CY} r={R + 6} fill="var(--bg2)" stroke="var(--b2)" strokeWidth="2"/>
        {SEGMENTS.map(s => (
          <g key={s.i}>
            <path
              d={s.d}
              fill={`color-mix(in oklch, ${s.color} ${landed === s.i ? 34 : 13}%, var(--bg2))`}
              stroke={`color-mix(in oklch, ${s.color} 45%, transparent)`}
              strokeWidth="1"
            />
            <text
              x={s.lx} y={s.ly}
              transform={`rotate(${s.rotate} ${s.lx} ${s.ly})`}
              textAnchor="middle" dominantBaseline="middle"
              style={{
                fill: s.color, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {segLabel(s.topic)}
            </text>
          </g>
        ))}
        <circle cx={CX} cy={CY} r="26" fill="var(--bg)" stroke="var(--b2)" strokeWidth="1.5"/>
        <circle cx={CX} cy={CY} r="5" fill="var(--amber)"/>
      </svg>
    </div>
  );
}

export default function SpinWheel({ username, stall, onBack }) {
  const slug = stall?.slug || 'stall-1';
  const storageKey = 'sns_' + (username || 'anon') + '_' + slug + '_spin';

  const [alreadyPlayed] = useState(() => readJSON(storageKey));

  const [round, setRound]       = useState(0);
  const [phase, setPhase]       = useState('wheel'); // 'wheel' | 'spinning' | 'question' | 'feedback' | 'finished'
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded]     = useState(null);    // topic index the pointer sits on
  const [q, setQ]               = useState(null);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(SPIN_SECONDS_PER_Q);
  const [answers, setAnswers]   = useState([]);      // { topic, sel, cor, pts, timedOut }
  const score = answers.reduce((s, a) => s + a.pts, 0);
  const animScore = useCountUp(phase === 'finished' ? score : 0, 650);

  const usedRef  = useRef([]);   // question texts already asked this run
  const landRef  = useRef(null);
  const timerRef = useRef(null);
  const fbRef    = useRef(null);

  // Playing counts as the attempt: leaving early finalises at the score so far
  // rather than handing back a fresh set of spins.
  const inProgress = !alreadyPlayed && phase !== 'finished';
  const save = useAttempt({
    key: storageKey, username, stall: slug, game: 'spin', score, active: inProgress,
  });
  const [guardedBack, leaveDialog] = useLeaveGuard(onBack, inProgress, () => save({ abandoned: true }));

  const spin = () => {
    const t = Math.floor(Math.random() * SPIN_TOPICS.length);
    const jitter = Math.random() * 30 - 15; // land off-centre inside the slice
    // Absolute rotation that puts segment t under the pointer, at least 4 full
    // turns clockwise from wherever the wheel currently rests.
    const want  = (360 - t * 45 + jitter + 360) % 360;
    const delta = ((want - (rotation % 360)) % 360 + 360) % 360;
    setRotation(r => r + 4 * 360 + delta);
    setLanded(null);
    setPhase('spinning');
    landRef.current = setTimeout(() => {
      const question = spinQuestion(t, usedRef.current);
      usedRef.current.push(question.question);
      setLanded(t);
      setQ(question);
      setSelected(null);
      setTimeLeft(SPIN_SECONDS_PER_Q);
      setPhase('question');
    }, SPIN_MS + 200);
  };
  useEffect(() => () => clearTimeout(landRef.current), []);

  // Question countdown, quiz-style: run out of clock and the spin scores 0.
  useEffect(() => {
    if (phase !== 'question') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setAnswers(a => [...a, { topic: landed, sel: -1, cor: q.correct, pts: 0, timedOut: true }]);
          setPhase('feedback');
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, landed, q]);

  // Feedback lingers, then the wheel returns — or the run ends and saves.
  useEffect(() => {
    if (phase !== 'feedback') return;
    fbRef.current = setTimeout(() => {
      if (round >= SPIN_ROUNDS - 1) {
        setPhase('finished');
      } else {
        setRound(r => r + 1);
        setQ(null);
        setPhase('wheel');
      }
    }, 1800);
    return () => clearTimeout(fbRef.current);
  }, [phase, round]);

  useEffect(() => {
    if (phase !== 'finished') return;
    save({ answers });
  }, [phase, answers, save]);

  const pick = (i) => {
    if (phase !== 'question') return;
    clearInterval(timerRef.current);
    setSelected(i);
    const ok  = i === q.correct;
    const pts = ok ? quizPoints(timeLeft) : 0;
    setAnswers(a => [...a, { topic: landed, sel: i, cor: q.correct, pts, timedOut: false }]);
    setPhase('feedback');
  };

  /* ── Already played ── */
  if (alreadyPlayed) {
    return (
      <div style={S.page}>
        <TopBar onBack={onBack} title="Spin Wheel" />
        <div style={{ padding: '0 24px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '44px 28px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--r-lg)', background: 'var(--s2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              border: '1px solid var(--b2)',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="14" width="20" height="14" rx="4" stroke="var(--text3)" strokeWidth="1.5"/>
                <path d="M10 14v-4a6 6 0 0112 0v4" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: 'var(--text2)', letterSpacing: '-0.02em' }}>Already Completed</div>
            <div className="label" style={{ marginBottom: 32 }}>One attempt per player — your score is final</div>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--amber-glow)', borderRadius: 'var(--r-lg)', padding: '20px 44px', border: '1px solid color-mix(in oklch, var(--amber) 18%, transparent)' }}>
              <span className="mono" style={{ fontSize: 52, fontWeight: 700, color: 'var(--amber)', lineHeight: 1, letterSpacing: '-0.04em' }}>{alreadyPlayed.score || 0}</span>
              <span className="label" style={{ color: 'var(--amber)', marginTop: 6, opacity: 0.8 }}>Points Scored</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px' }}>
          <button onClick={onBack} style={S.backFull}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  /* ── Results ── */
  if (phase === 'finished') {
    const correct = answers.filter(a => a.sel === a.cor).length;
    return (
      <div style={S.page}>
        <TopBar onBack={onBack} title="Results" />
        <div style={{ padding: '0 24px', animation: 'scaleIn 0.45s var(--ease-out)' }}>
          <div className="grad-border" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 'calc(var(--r-lg) - 1.5px)', padding: '28px 24px', textAlign: 'center' }}>
              <div className="stagger" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {answers.map((a, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 'var(--r-xs)',
                    background: a.sel === a.cor ? 'var(--green-glow)' : 'var(--danger-soft)',
                    border: `1px solid ${a.sel === a.cor ? 'color-mix(in oklch, var(--green) 25%, transparent)' : 'color-mix(in oklch, var(--red) 25%, transparent)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: a.sel === a.cor ? 'var(--green)' : 'var(--red)',
                  }}>
                    {a.sel === a.cor ? '✓' : '✗'}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }} className="grad-text stamp-in">{animScore}</div>
              <div className="label" style={{ marginTop: 6, marginBottom: 24 }}>Points</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                <div>
                  <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.03em' }}>{correct}</div>
                  <div className="label" style={{ marginTop: 4 }}>Correct</div>
                </div>
                <div style={{ width: 1, background: 'var(--b1)' }}/>
                <div>
                  <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.03em' }}>{SPIN_ROUNDS - correct}</div>
                  <div className="label" style={{ marginTop: 4 }}>Wrong</div>
                </div>
              </div>
            </div>
          </div>

          <div className="label" style={{ marginBottom: 10 }}>Spin Review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.map((a, i) => {
              const ok = a.sel === a.cor;
              return (
                <div key={i} style={{
                  padding: '13px 16px', borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: ok ? 'color-mix(in oklch, var(--green) 5%, var(--bg2))' : 'color-mix(in oklch, var(--red) 5%, var(--bg2))',
                  border: `1px solid ${ok ? 'color-mix(in oklch, var(--green) 16%, transparent)' : 'color-mix(in oklch, var(--red) 16%, transparent)'}`,
                }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>
                    SPIN {i + 1} · {SPIN_TOPICS[a.topic]?.label.toUpperCase()}
                  </span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: ok ? 'var(--green)' : 'var(--red)' }}>
                    {a.timedOut ? '⏱ TIMED OUT' : ok ? '✓' : '✗'} · +{a.pts}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '0 24px' }}>
          <button onClick={onBack} style={S.backFull}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  /* ── Playing ── */
  const onWheel = phase === 'wheel' || phase === 'spinning';
  const last = answers[answers.length - 1];
  return (
    <div style={S.page}>
      {leaveDialog}
      <TopBar
        onBack={guardedBack}
        title="Spin Wheel"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="label">SCORE</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.02em' }}>{score}</span>
          </div>
        }
      />

      {/* Round progress */}
      <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'center', gap: 8 }}>
        {Array.from({ length: SPIN_ROUNDS }, (_, i) => (
          <RoundNode key={i} index={i} current={round} answer={answers[i]} />
        ))}
      </div>

      {onWheel && (
        <>
          <div style={{ padding: '0 24px', textAlign: 'center' }}>
            <div className="label" style={{ color: 'var(--amber)' }}>
              SPIN {round + 1} OF {SPIN_ROUNDS}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginTop: 6 }}>
              {phase === 'spinning'
                ? 'Where will it land…'
                : 'Spin the wheel — you get one question on whatever topic it lands.'}
            </p>
          </div>

          <Wheel rotation={rotation} spinning={phase === 'spinning'} landed={landed} />

          <div style={{ padding: '0 24px' }}>
            <button
              onClick={spin}
              disabled={phase === 'spinning'}
              style={{
                width: '100%', padding: '20px', borderRadius: 'var(--r-md)',
                fontSize: 17, fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'inherit',
                cursor: phase === 'spinning' ? 'wait' : 'pointer', border: 'none', color: 'var(--on-accent)',
                background: 'var(--grad-hot)', opacity: phase === 'spinning' ? 0.6 : 1,
                boxShadow: '0 8px 28px -8px var(--amber-glow)',
                transition: 'opacity 0.2s',
              }}
            >
              {phase === 'spinning' ? 'SPINNING…' : '◈ SPIN THE WHEEL'}
            </button>
          </div>
        </>
      )}

      {(phase === 'question' || phase === 'feedback') && q && (
        <>
          {/* Topic + timer */}
          <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag tag-amber" style={{ fontSize: 11 }}>
              ◈ {SPIN_TOPICS[landed]?.label.toUpperCase()}
            </span>
            {phase === 'question' && (
              <span className="mono" style={{
                fontSize: 18, fontWeight: 700,
                color: timeLeft <= 10 ? 'var(--red)' : 'var(--amber)',
                textShadow: `0 0 14px ${timeLeft <= 10 ? 'var(--red)' : 'var(--amber)'}`,
              }}>
                {timeLeft}s
              </span>
            )}
          </div>

          {/* Question card */}
          <div style={{ padding: '0 24px' }}>
            <div style={{
              background: 'var(--s2)', border: '1px solid var(--b2)',
              borderRadius: 'var(--r-lg)', padding: '24px 20px',
              animation: 'scaleIn 0.3s var(--ease-out)',
              boxShadow: 'var(--shadow)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.55, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                {q.question}
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const showFb     = phase === 'feedback';
              const isCorrect  = i === q.correct;
              const isSelected = i === selected;
              let bg = 'var(--s1)', border = 'var(--b1)', textC = 'var(--text)';

              if (showFb) {
                if (isCorrect)       { bg = 'var(--success-soft)'; border = 'color-mix(in oklch, var(--green) 40%, transparent)'; textC = 'var(--green)'; }
                else if (isSelected) { bg = 'var(--danger-soft)'; border = 'color-mix(in oklch, var(--red) 40%, transparent)'; textC = 'var(--red)'; }
                else                 { textC = 'var(--text4)'; }
              }

              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', width: '100%', textAlign: 'left',
                    background: bg, border: `1.5px solid ${border}`,
                    borderRadius: 'var(--r-md)', color: textC, fontSize: 15,
                    minHeight: 56, transition: 'all 0.22s var(--ease-out)',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  <span className="mono" style={{
                    width: 34, height: 34, borderRadius: 'var(--r-xs)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                    background: showFb && isCorrect ? 'var(--green-glow)' : 'var(--s2)',
                    color: showFb && isCorrect ? 'var(--green)' : 'var(--text3)',
                    border: `1px solid ${showFb && isCorrect ? 'color-mix(in oklch, var(--green) 30%, transparent)' : 'var(--b1)'}`,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1, fontWeight: 500, lineHeight: 1.45 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {phase === 'feedback' && last && (
            <div style={{
              margin: '0 24px', padding: '16px 20px', borderRadius: 'var(--r-md)',
              background: last.sel === last.cor ? 'var(--success-soft)' : last.timedOut ? 'var(--warning-soft)' : 'var(--danger-soft)',
              border: `1px solid ${last.sel === last.cor ? 'color-mix(in oklch, var(--green) 22%, transparent)' : last.timedOut ? 'color-mix(in oklch, var(--amber) 24%, transparent)' : 'color-mix(in oklch, var(--red) 22%, transparent)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'scaleIn 0.3s var(--ease-spring)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: last.sel === last.cor ? 'var(--green)' : last.timedOut ? 'var(--amber)' : 'var(--red)' }}>
                {last.sel === last.cor ? 'Correct!' : last.timedOut ? "Time's up" : 'Incorrect'}
              </span>
              {last.sel === last.cor && (
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>+{last.pts} pts</span>
              )}
            </div>
          )}
        </>
      )}

      <div className="mono" style={{
        textAlign: 'center', fontSize: 10, color: 'var(--text4)',
        padding: '0 22px', letterSpacing: '0.08em', lineHeight: 1.8,
      }}>
        8 TOPICS ON THE WHEEL · 1 QUESTION PER SPIN<br/>
        FASTER ANSWERS SCORE MORE
      </div>
    </div>
  );
}
