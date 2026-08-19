import { useState, useEffect, useRef } from 'react';
import TopBar from './TopBar.jsx';
import { saveScore } from '../lib/saveScore.js';
import { useCountUp } from '../lib/useCountUp.js';
import { readJSON } from '../lib/storage.js';
import { BasketballGraphic } from './BasketballGraphic.jsx';

// 4 Categories (Baskets / Hoops)
export const STAGES = [
  { id: 'discover', stage: 'STAGE 1', name: 'Discover', color: '#3b82f6' },      // Blue
  { id: 'identity', stage: 'STAGE 2', name: 'Identity', color: '#f59e0b' },      // Amber
  { id: 'provision', stage: 'STAGE 3', name: 'Provision', color: '#a855f7' },    // Purple
  { id: 'secure', stage: 'STAGE 4', name: 'Secure & Notify', color: '#10b981' }, // Green
];

// 14 Total Options Pool
export const ZTP_OPTIONS_POOL = [
  // Discover
  { text: 'Device Connectivity Check', stageId: 'discover' },
  { text: 'Pull NetCompose Config', stageId: 'discover' },
  { text: 'DNS Resolution Check', stageId: 'discover' },
  // Identity
  { text: 'Fetch Device Details', stageId: 'identity' },
  { text: 'Fetch OS Details', stageId: 'identity' },
  // Provision
  { text: 'Copy OS Image', stageId: 'provision' },
  { text: 'OS Upgrade', stageId: 'provision' },
  { text: 'Post-Upgrade Connectivity', stageId: 'provision' },
  { text: 'Apply Configuration', stageId: 'provision' },
  // Secure & Notify
  { text: 'Verify TACACS', stageId: 'secure' },
  { text: 'Enable Config Encryption', stageId: 'secure' },
  { text: 'Register in Vault', stageId: 'secure' },
  { text: 'Final Validation', stageId: 'secure' },
  { text: 'Email Notification', stageId: 'secure' },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ZtpBasketball({ username, stall, onBack }) {
  const slug = stall?.slug || 'stall-3';
  const key = 'sns_' + (username || 'anon') + '_' + slug + '_ztp';

  const [game] = useState(() => {
    const cached = readJSON(key);
    const roundPool = shuffleArray(ZTP_OPTIONS_POOL).slice(0, 5);
    return {
      done: !!cached,
      prevScore: cached?.score || 0,
      prevGoals: cached?.goals || 0,
      pool: roundPool,
    };
  });
  const { done, prevScore, prevGoals, pool } = game;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState(0);
  const [misses, setMisses] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [gState, setGState] = useState('playing');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type) => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 1800);
  };

  // Slingshot Pull State (Screen relative offsets)
  const [drag, setDrag] = useState({ active: false, pullX: 0, pullY: 0 });
  const [flight, setFlight] = useState(null); // Active ball motion along parabola

  const courtRef = useRef(null);
  const savedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const animScore = useCountUp(score, 400);
  const currentAction = pool[currentIndex];
  const shotsLeft = pool.length - currentIndex;

  // Save Score
  useEffect(() => {
    if (gState !== 'finished' || savedRef.current) return;
    savedRef.current = true;
    localStorage.setItem(key, JSON.stringify({
      score, goals, misses, penalties, playedAt: Date.now()
    }));
    saveScore(username, slug, 'ztp', score);
  }, [gState, score, goals, misses, penalties, key, username, slug]);

  const handleMouseDown = (e) => {
    if (gState !== 'playing' || flight || !currentAction) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    setDrag({ active: true, pullX: 0, pullY: 0 });
  };

  const handleMouseMove = (e) => {
    if (!drag.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rawDx = clientX - dragStartRef.current.x;
    const rawDy = clientY - dragStartRef.current.y;

    const maxPull = 140;
    const dist = Math.hypot(rawDx, Math.max(0, rawDy));
    const factor = dist > maxPull ? maxPull / dist : 1;

    setDrag({
      active: true,
      pullX: rawDx * factor,
      pullY: Math.max(0, rawDy) * factor,
    });
  };

  const handleMouseUp = () => {
    if (!drag.active || !courtRef.current) return;
    const courtRect = courtRef.current.getBoundingClientRect();
    
    const { pullX, pullY } = drag;
    setDrag({ active: false, pullX: 0, pullY: 0 });

    if (pullY < 12 && Math.abs(pullX) < 12) return;

    const ballStartX = courtRect.width / 2 + pullX * 0.5;
    const ballStartY = courtRect.height * 0.72 + pullY * 0.5;

    // Direct trajectory calculation: Smooth horizontal aiming across all 4 hoops
    const hoopWidth = courtRect.width / 4;
    // Map pullX angle directly across court width with full reach to outer corner hoops
    const aimRatio = (-pullX / 100); // -1.0 to +1.0
    const targetX = Math.max(15, Math.min(courtRect.width - 15, (courtRect.width / 2) + (aimRatio * (courtRect.width * 0.48))));
    const targetY = 80; // Altitude line of the hoop rim net

    // Hoop collision: Check distance to nearest hoop center
    let hitStage = null;

    STAGES.forEach((stage, idx) => {
      const hoopCenterX = idx * hoopWidth + hoopWidth / 2;
      const distX = Math.abs(targetX - hoopCenterX);
      
      // Physical Overlap: Check if shot lands within stage hoop rim column (55% of hoop column width)
      if (distX <= hoopWidth * 0.55) {
        hitStage = stage;
      }
    });

    const isMatch = hitStage && hitStage.id === currentAction.stageId;
    const flightDuration = 700;
    const freezeDuration = 350; // Freeze ball at rim collision point for 350ms

    setFlight({
      startTime: performance.now(),
      duration: flightDuration,
      freezeDuration,
      startX: ballStartX,
      startY: ballStartY,
      targetX,
      targetY,
      hitStage,
      isMatch,
    });

    setTimeout(() => {
      if (isMatch) {
        // 5 Shots * 40 pts = 200 MAX SCORE
        setScore(s => s + 40);
        setGoals(g => g + 1);
        setHistory(h => [{ action: currentAction.text, type: 'goal', pts: 40 }, ...h]);
        showToastMsg(`🏀 GOAL! +40 PTS`, 'goal');
      } else if (hitStage) {
        // Penalty ONLY when physically touching the wrong hoop rim
        setScore(s => Math.max(0, s - 10));
        setPenalties(p => p + 1);
        setHistory(h => [{ action: currentAction.text, type: 'penalty', pts: -10, wrong: hitStage.name }, ...h]);
        showToastMsg(`⚠️ PENALTY (-10 PTS) - ${hitStage.name}`, 'penalty');
      } else {
        // Miss when shot airballs or doesn't touch any hoop
        setMisses(m => m + 1);
        setHistory(h => [{ action: currentAction.text, type: 'miss', pts: 0 }, ...h]);
        showToastMsg(`❌ MISS! 0 PTS`, 'miss');
      }

      setFlight(null);
      if (currentIndex + 1 >= pool.length) {
        setGState('finished');
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, flightDuration + freezeDuration);
  };

  // Trajectory Trace Line Render (Bright White Dotted Line - 45% Path Length Limit)
  const renderAimTrajectory = () => {
    if (!drag.active || !courtRef.current) return null;
    const courtRect = courtRef.current.getBoundingClientRect();
    const startX = courtRect.width / 2 + drag.pullX * 0.5;
    const startY = courtRect.height * 0.70 + drag.pullY * 0.5;

    const hoopWidth = courtRect.width / 4;
    const aimRatio = (-drag.pullX / 100);
    const targetX = Math.max(15, Math.min(courtRect.width - 15, (courtRect.width / 2) + (aimRatio * (courtRect.width * 0.48))));
    const targetY = 80;

    const dots = [];
    const steps = 9;
    const pathCutoff = 0.45; // 45% truncated trace preview limit

    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * pathCutoff;
      // Parabolic Arc to Target Rim Line
      const x = startX + (targetX - startX) * t;
      const y = startY + (targetY - startY) * t - Math.sin(t * Math.PI) * 160;
      dots.push({ x, y });
    }

    return (
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, width: '100%', height: '100%' }}>
        {dots.map((dot, idx) => (
          <circle
            key={idx}
            cx={dot.x}
            cy={dot.y}
            r={Math.max(2.5, 6 * (1 - idx / steps))}
            fill="#ffffff"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            opacity={1.0 - (idx / steps) * 0.4}
          />
        ))}
      </svg>
    );
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!flight) return;
    const interval = setInterval(() => setTick(t => t + 1), 16);
    return () => clearInterval(interval);
  }, [flight]);

  let ballPos = null;
  if (flight) {
    const elapsedRaw = (performance.now() - flight.startTime) / flight.duration;
    // Fine-tuned freeze progress at 0.75 (perfectly centered inside hoop rim)
    const elapsed = Math.min(0.75, elapsedRaw);
    const currX = flight.startX + (flight.targetX - flight.startX) * elapsed;
    const currY = flight.startY + (flight.targetY - flight.startY) * elapsed - Math.sin(elapsed * Math.PI) * 160;
    const scale = 1 - (elapsed * 0.45);
    const rotation = Math.min(1, elapsedRaw) * 540;
    ballPos = { x: currX, y: currY, scale, rotation, inRim: true };
  }

  if (done) {
    return (
      <div className="screen" style={{ paddingBottom: 36 }}>
        <TopBar onBack={onBack} title="ZTP Basketball" />
        <div style={{ padding: '0 22px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Already Completed</div>
            <div className="label" style={{ marginBottom: 28 }}>One attempt per player — your score is final</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              <div style={{ background: 'var(--green-glow)', borderRadius: 'var(--r-lg)', padding: '16px 26px', border: '1px solid color-mix(in oklch, var(--green) 20%, transparent)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--green-dim)' }}>{prevScore}</div>
                <div className="label" style={{ color: 'var(--green-dim)', opacity: 0.8, marginTop: 4 }}>Points ({prevGoals} Goals)</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 22px 0' }}>
          <button onClick={onBack} className="btn-secondary" style={{ width: '100%' }}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (gState === 'finished') {
    return (
      <div className="screen" style={{ paddingBottom: 36 }}>
        <TopBar onBack={onBack} title="ZTP Provision Monitor Results" />
        <div style={{ padding: '0 22px', animation: 'scaleIn 0.45s var(--ease-out)' }}>
          <div className="grad-border" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 'calc(var(--r-lg) - 1.5px)', padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green-dim)', marginBottom: 16 }}>
                🏀 Provisioning Round Complete!
              </div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 800, color: 'var(--green-dim)', marginBottom: 6 }}>
                {animScore}
              </div>
              <div className="label" style={{ color: 'var(--text3)', marginBottom: 20 }}>
                GOALS: {goals} | PENALTIES: {penalties} | MISSES: {misses}
              </div>
            </div>
          </div>
          <button onClick={onBack} className="btn-secondary" style={{ width: '100%' }}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="screen"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      <TopBar onBack={onBack} title="ZTP Provisioning Basketball" />

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '8px 20px',
          borderRadius: 'var(--r-full)',
          background: toast.type === 'goal' ? 'var(--green)' : toast.type === 'penalty' ? 'var(--red)' : 'var(--amber)',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'stampIn 0.3s var(--ease-spring)',
          whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Main Basketball Court Area */}
        <div
          ref={courtRef}
          style={{ flex: 1, position: 'relative', background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)', overflow: 'hidden', height: '100%' }}
        >
          {/* 4 Stage Hoops */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '12px 6px', gap: 4, position: 'relative', zIndex: 5 }}>
            {STAGES.map((stage) => (
              <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--bg2)',
                  border: `2px solid ${stage.color}`,
                  borderRadius: 'var(--r-md)',
                  padding: '4px 4px',
                  textAlign: 'center',
                  width: '98%',
                  boxShadow: `0 0 12px color-mix(in oklch, ${stage.color} 30%, transparent)`
                }}>
                  <div className="label" style={{ fontSize: 8, color: stage.color }}>{stage.stage}</div>
                  <div style={{ fontSize: 'clamp(9px, 2.2vw, 13px)', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.name}</div>
                </div>

                {/* Net Rim */}
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <svg width="60" height="42" viewBox="0 0 70 50">
                    <rect x="15" y="2" width="40" height="8" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <ellipse cx="35" cy="14" rx="26" ry="7" fill="none" stroke="#ef4444" strokeWidth="4.5" />
                    <path d="M9 14 L19 46 L51 46 L61 14" fill="none" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Dotted Aim Trajectory Arc */}
          {renderAimTrajectory()}

          {!drag.active && !flight && (
            <div style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--b2)',
              padding: '6px 16px',
              borderRadius: 'var(--r-full)',
              pointerEvents: 'none'
            }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, letterSpacing: '0.08em' }}>
                DRAG BACK TO AIM & RELEASE
              </span>
            </div>
          )}

          {/* Current Ball Action (Slingshot Drag Origin) */}
          {currentAction && !flight && (
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{
                position: 'absolute',
                top: '70%',
                left: '50%',
                transform: `translate(calc(-50% + ${drag.pullX * 0.5}px), calc(-50% + ${drag.pullY * 0.5}px))`,
                cursor: 'grab',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <BasketballGraphic size={52} />

              <div style={{
                marginTop: 6,
                background: '#1e1b4b',
                border: '1.5px solid #6366f1',
                padding: '5px 12px',
                borderRadius: 'var(--r-md)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
              }}>
                {currentAction.text}
              </div>
            </div>
          )}

          {/* Flying Basketball Element */}
          {ballPos && (
            <div
              style={{
                position: 'absolute',
                left: ballPos.x,
                top: ballPos.y,
                transform: `translate(-50%, -50%) scale(${ballPos.scale})`,
                zIndex: ballPos.inRim ? 4 : 25,
                pointerEvents: 'none',
              }}
            >
              <BasketballGraphic size={52} rotation={ballPos.rotation} />
            </div>
          )}
        </div>

        {/* Desktop Side Panel (Hidden on Mobile) */}
        <div
          className="ztp-monitor-panel"
          style={{
            width: 300,
            background: 'var(--bg2)',
            borderLeft: '1px solid var(--b1)',
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 14,
          }}
        >
          <div>
            <div className="label" style={{ fontSize: 9, color: 'var(--text3)' }}>LIVE ROUND</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>ZTP Provision Monitor</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--s1)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
              <div className="label" style={{ fontSize: 9 }}>SCORE</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-dim)' }}>{score}</div>
            </div>
            <div style={{ background: 'var(--s1)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
              <div className="label" style={{ fontSize: 9 }}>GOALS</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--cyan)' }}>{goals}</div>
            </div>
            <div style={{ background: 'var(--s1)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
              <div className="label" style={{ fontSize: 9 }}>PENALTIES</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{penalties}</div>
            </div>
            <div style={{ background: 'var(--s1)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
              <div className="label" style={{ fontSize: 9 }}>MISSES</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>{misses}</div>
            </div>
          </div>

          <div style={{ background: 'var(--s1)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="label" style={{ fontSize: 9 }}>CURRENT ACTION</span>
              <span className="label" style={{ fontSize: 9, color: 'var(--red)' }}>SHOTS LEFT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{currentAction?.text || '—'}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < shotsLeft ? '#ef4444' : 'var(--text4)'
                  }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="label" style={{ fontSize: 9 }}>ROUND LOGS</div>
            {history.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic' }}>No shots taken yet</div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 11,
                  background: item.type === 'goal' ? 'var(--green-glow)' : item.type === 'penalty' ? 'var(--danger-soft)' : 'var(--s1)',
                  border: `1px solid ${item.type === 'goal' ? 'var(--green)' : item.type === 'penalty' ? 'var(--red)' : 'var(--b1)'}`,
                  color: item.type === 'goal' ? 'var(--green-dim)' : item.type === 'penalty' ? 'var(--red)' : 'var(--text2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 600 }}>{item.action}</span>
                  <span className="mono" style={{ fontWeight: 800 }}>{item.pts > 0 ? `+${item.pts}` : item.pts}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--r-md)', textAlign: 'center', border: '1px solid var(--b1)' }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>TOTAL: {score}</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Score Strip (Visible on Mobile Only) */}
      <div
        className="ztp-mobile-bottom-strip"
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--b1)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="label" style={{ fontSize: 8, color: 'var(--text3)' }}>SCORE</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 900, color: 'var(--green-dim)' }}>{score}</div>
          </div>
          <div>
            <div className="label" style={{ fontSize: 8, color: 'var(--cyan)' }}>GOALS</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--cyan)' }}>{goals}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span className="label" style={{ fontSize: 8, color: 'var(--text3)', marginRight: 4 }}>SHOTS LEFT:</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < shotsLeft ? '#ef4444' : 'var(--text4)'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
