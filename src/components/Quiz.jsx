import { useState, useEffect, useRef } from 'react';
import { quizRound } from '../data.js';
import TopBar from './TopBar.jsx';
import { saveScore } from '../lib/saveScore.js';
import { useCountUp } from '../lib/useCountUp.js';
import { readJSON } from '../lib/storage.js';
import { quizPoints } from '../lib/scoring.js';

/* ── Circular countdown timer ── */
function CircleTimer({ timeLeft, total, color }) {
  const r    = 24;
  const circ = 2 * Math.PI * r;
  const pct  = timeLeft / total;
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--s3)" strokeWidth="3.5"/>
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="mono" style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color,
        textShadow: `0 0 14px ${color}`,
      }}>
        {timeLeft}
      </div>
    </div>
  );
}

/* ── Progress node ── */
function ProgressNode({ index, current, answer }) {
  const past = index < current;
  const active = index === current;
  const correct = past && answer?.sel === answer?.cor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--s3)' : past ? (correct ? 'var(--success-soft)' : 'var(--danger-soft)') : 'var(--s1)',
        border: `1.5px solid ${active ? 'var(--b3)' : past ? (correct ? 'color-mix(in oklch, var(--green) 30%, transparent)' : 'color-mix(in oklch, var(--red) 30%, transparent)') : 'var(--b1)'}`,
        boxShadow: active ? 'var(--shadow-sm)' : past && correct ? '0 0 12px var(--green-glow)' : 'none',
        transition: 'all 0.3s var(--ease-out)',
      }}>
        {past
          ? <span style={{ fontSize: 13, color: correct ? 'var(--green)' : 'var(--red)' }}>{correct ? '✓' : '✗'}</span>
          : <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--text)' : 'var(--text4)' }}>{index + 1}</span>
        }
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh', paddingBottom: 36 },
  backFull: {
    width: '100%', padding: '16px', background: 'var(--s2)',
    border: '1px solid var(--b1)', borderRadius: 0,
    color: 'var(--text2)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default function Quiz({ username, stall, onBack }) {
  const slug = stall?.slug || 'stall-1';
  const storageKey = 'sns_' + (username || 'anon') + '_' + slug + '_quiz';

  // The round is decided once at mount: a cached result means this stall is
  // already played; otherwise quizRound() draws 5 random questions and shuffles
  // each one's options (remapping `correct`) so the answer never sits in a fixed
  // position. Quiz is mounted fresh per navigation, so username/stall are stable
  // for its lifetime and a lazy initializer is the right place for this.
  const [round] = useState(() => {
    const cached = readJSON(storageKey);
    return cached
      ? { alreadyPlayed: true, prevScore: cached.score || 0, questions: [] }
      : { alreadyPlayed: false, prevScore: 0, questions: quizRound(slug, 5) };
  });
  const { alreadyPlayed, prevScore, questions } = round;

  const [idx, setIdx]                     = useState(0);
  const [selected, setSelected]           = useState(null);
  const [showFb, setShowFb]               = useState(false);
  const [score, setScore]                 = useState(0);
  const [timeLeft, setTimeLeft]           = useState(30);
  const [gameState, setGameState]         = useState('playing');
  const [answers, setAnswers]             = useState([]);
  // Hold at 0 during play so the count-up runs when the results screen mounts.
  const animScore = useCountUp(gameState === 'finished' ? score : 0, 650);
  const timerRef = useRef(null);
  const fbRef    = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (gameState !== 'playing' || showFb || !questions.length || alreadyPlayed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setShowFb(true);
          setAnswers(a => [...a, { sel: -1, cor: questions[idx].correct, timedOut: true, pts: 0 }]);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, showFb, idx, questions, alreadyPlayed]);

  useEffect(() => {
    if (!showFb) return;
    fbRef.current = setTimeout(() => {
      if (idx >= 4) {
        setGameState('finished');
        if (!savedRef.current) {
          savedRef.current = true;
          localStorage.setItem(storageKey, JSON.stringify({ score, answers, playedAt: Date.now() }));
          saveScore(username, slug, 'quiz', score);
        }
      } else {
        setIdx(i => i + 1); setSelected(null); setShowFb(false); setTimeLeft(30);
      }
    }, 1800);
    return () => clearTimeout(fbRef.current);
  }, [showFb, idx, score, answers, storageKey, slug, username]);

  const pick = (i) => {
    if (showFb || gameState !== 'playing') return;
    clearInterval(timerRef.current);
    setSelected(i); setShowFb(true);
    const ok  = i === questions[idx].correct;
    const pts = ok ? quizPoints(timeLeft) : 0;
    if (ok) setScore(s => s + pts);
    setAnswers(a => [...a, { sel: i, cor: questions[idx].correct, timedOut: false, pts }]);
  };

  /* ── Already played ── */
  if (alreadyPlayed) {
    return (
      <div style={S.page}>
        <TopBar onBack={onBack} title="Network Quiz" />
        <div style={{ padding: '0 24px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '44px 28px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 0, background: 'var(--s2)',
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
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--green-glow)', borderRadius: 0, padding: '20px 44px', border: '1px solid color-mix(in oklch, var(--green) 18%, transparent)' }}>
              <span className="mono" style={{ fontSize: 52, fontWeight: 700, color: 'var(--green)', lineHeight: 1, letterSpacing: '-0.04em' }}>{prevScore}</span>
              <span className="label" style={{ color: 'var(--green)', marginTop: 6, opacity: 0.8 }}>Points Scored</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px' }}>
          <button onClick={onBack} style={S.backFull}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!questions.length) return null;

  /* ── Results screen ── */
  if (gameState === 'finished') {
    const correct = answers.filter(a => a.sel === a.cor).length;
    return (
      <div style={S.page}>
        <TopBar onBack={onBack} title="Results" />
        <div style={{ padding: '0 24px', animation: 'scaleIn 0.45s var(--ease-out)' }}>

          {/* Score hero */}
          <div className="grad-border" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 0, padding: '28px 24px', textAlign: 'center' }}>
              {/* LED result row */}
              <div className="stagger" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {answers.map((a, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 0,
                    background: a.sel === a.cor ? 'var(--green-glow)' : 'var(--danger-soft)',
                    border: `1px solid ${a.sel === a.cor ? 'color-mix(in oklch, var(--green) 25%, transparent)' : 'color-mix(in oklch, var(--red) 25%, transparent)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: a.sel === a.cor ? 'var(--green)' : 'var(--red)',
                    boxShadow: a.sel === a.cor ? '0 0 12px var(--green-glow)' : 'none',
                  }}>
                    {a.sel === a.cor ? '✓' : '✗'}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, animationDelay: '0.1s' }} className="grad-text stamp-in">{animScore}</div>
              <div className="label" style={{ marginTop: 6, marginBottom: 24 }}>Points</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                <div>
                  <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.03em' }}>{correct}</div>
                  <div className="label" style={{ marginTop: 4 }}>Correct</div>
                </div>
                <div style={{ width: 1, background: 'var(--b1)' }}/>
                <div>
                  <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.03em' }}>{5 - correct}</div>
                  <div className="label" style={{ marginTop: 4 }}>Wrong</div>
                </div>
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="label" style={{ marginBottom: 10 }}>Answer Review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.map((a, i) => {
              const ok = a.sel === a.cor;
              return (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 0,
                  background: ok ? 'color-mix(in oklch, var(--green) 5%, var(--bg2))' : 'color-mix(in oklch, var(--red) 5%, var(--bg2))',
                  border: `1px solid ${ok ? 'color-mix(in oklch, var(--green) 16%, transparent)' : 'color-mix(in oklch, var(--red) 16%, transparent)'}`,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.5 }}>{questions[i].question}</div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: ok ? 'var(--green)' : 'var(--red)' }}>
                    {a.timedOut ? '⏱ Timed out' : questions[i].options[a.sel]}
                    {!ok && <span style={{ color: 'var(--green)', marginLeft: 10 }}>→ {questions[i].options[a.cor]}</span>}
                  </div>
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
  const q      = questions[idx];
  const tColor = timeLeft <= 10 ? 'var(--red)' : timeLeft <= 20 ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={S.page}>
      <TopBar
        onBack={onBack}
        title="Network Quiz"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="label">SCORE</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.02em' }}>{score}</span>
          </div>
        }
      />

      {/* Timer + progress nodes */}
      <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CircleTimer timeLeft={timeLeft} total={30} color={tColor} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[0,1,2,3,4].map(i => (
            <ProgressNode key={i} index={i} current={idx} answer={answers[i]} />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div style={{ padding: '0 24px' }}>
        <div style={{
          background: 'var(--s2)', border: '1px solid var(--b2)',
          borderRadius: 0, padding: '24px 20px',
          animation: 'scaleIn 0.3s var(--ease-out)',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="label" style={{ color: 'var(--green)' }}>Q{idx + 1} OF 5</span>
            <div style={{ flex: 1, height: 1, background: 'var(--b1)' }}/>
            {timeLeft <= 10 && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, animation: 'pulse 0.8s ease infinite' }}>HURRY!</span>
            )}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.55, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {q.question}
          </div>
        </div>
      </div>

      {/* Options */}
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt, i) => {
          const isCorrect  = i === q.correct;
          const isSelected = i === selected;
          let bg     = 'var(--s1)';
          let border = 'var(--b1)';
          let textC  = 'var(--text)';
          let shadow = 'none';

          if (showFb) {
            if (isCorrect)  { bg = 'var(--success-soft)'; border = 'color-mix(in oklch, var(--green) 40%, transparent)'; textC = 'var(--green)'; shadow = '0 0 24px var(--green-glow)'; }
            else if (isSelected) { bg = 'var(--danger-soft)'; border = 'color-mix(in oklch, var(--red) 40%, transparent)'; textC = 'var(--red)'; }
            else { textC = 'var(--text4)'; }
          }

          return (
            <button
              key={i}
              onClick={() => pick(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', width: '100%', textAlign: 'left',
                background: bg, border: `1.5px solid ${border}`,
                borderRadius: 0, color: textC, fontSize: 15,
                minHeight: 56, transition: 'all 0.22s var(--ease-out)',
                boxShadow: shadow, fontFamily: 'inherit', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!showFb) e.currentTarget.style.background = 'var(--s3)'; }}
              onMouseLeave={e => { if (!showFb) e.currentTarget.style.background = bg; }}
            >
              <span className="mono" style={{
                width: 34, height: 34, borderRadius: 0, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: showFb && isCorrect ? 'var(--green-glow)' : 'var(--s2)',
                color: showFb && isCorrect ? 'var(--green)' : 'var(--text3)',
                border: `1px solid ${showFb && isCorrect ? 'color-mix(in oklch, var(--green) 30%, transparent)' : 'var(--b1)'}`,
                transition: 'all 0.22s',
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1, fontWeight: 500, lineHeight: 1.45 }}>{opt}</span>
              {showFb && isCorrect && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="8" fill="var(--green-glow)"/>
                  <path d="M5.5 9l2.5 2.5 4.5-5" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      {showFb && (() => {
        const last = answers[answers.length - 1];
        const isRight = last?.sel === last?.cor;
        const isTimeout = last?.timedOut;
        return (
          <div style={{
            margin: '0 24px', padding: '16px 20px', borderRadius: 0,
            background: isRight ? 'var(--success-soft)' : isTimeout ? 'var(--warning-soft)' : 'var(--danger-soft)',
            border: `1px solid ${isRight ? 'color-mix(in oklch, var(--green) 22%, transparent)' : isTimeout ? 'color-mix(in oklch, var(--amber) 24%, transparent)' : 'color-mix(in oklch, var(--red) 22%, transparent)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'scaleIn 0.3s var(--ease-spring)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: isRight ? 'var(--green)' : isTimeout ? 'var(--amber)' : 'var(--red)' }}>
              {isRight ? 'Correct!' : isTimeout ? "Time's up" : 'Incorrect'}
            </span>
            {isRight && (
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>+{last.pts} pts</span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
