import { useState, useEffect, useRef } from 'react';
import { getFingerprint } from '../lib/fingerprint.js';

const ADMIN_USERNAME = 'admin';
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

/* ── Animated network topology ── */
function NetTopology() {
  return (
    <div
      style={{
        position: 'relative',
        width: 'clamp(130px, 32vw, 170px)',
        aspectRatio: '180 / 160',
        margin: '0 auto',
        animation: 'float 5s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 180 160" fill="none" style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="ng1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="var(--green)"/>
            <stop offset="55%"  stopColor="var(--cyan)"/>
            <stop offset="100%" stopColor="var(--blue)"/>
          </linearGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="90" cy="80" r="62" stroke="url(#ng1)" strokeWidth="0.6" opacity="0.22" strokeDasharray="3 7"/>
        <circle cx="90" cy="80" r="44" stroke="url(#ng1)" strokeWidth="0.6" opacity="0.14" strokeDasharray="2 6"/>
        <line x1="90"  y1="46"  x2="90"  y2="24"  stroke="var(--green)" strokeWidth="0.8" opacity="0.35" strokeDasharray="3 4"/>
        <line x1="148" y1="110" x2="110" y2="92"  stroke="var(--cyan)" strokeWidth="0.8" opacity="0.35" strokeDasharray="3 4"/>
        <line x1="32"  y1="110" x2="70"  y2="92"  stroke="var(--violet)" strokeWidth="0.8" opacity="0.35" strokeDasharray="3 4"/>
        <circle cx="90" cy="80" r="18" fill="var(--green-glow)" stroke="url(#ng1)" strokeWidth="1.8" filter="url(#glow-filter)"/>
        <circle cx="90" cy="80" r="6"  fill="var(--green)" opacity="0.95" filter="url(#glow-filter)"/>
        <circle cx="90" cy="80" r="10" fill="none" stroke="var(--green)" strokeWidth="0.6" opacity="0.5" style={{ animation: 'pulse 2s ease infinite' }}/>
        <circle cx="90"  cy="18"  r="10" fill="var(--cyan-glow)" stroke="var(--cyan)" strokeWidth="1.2" filter="url(#glow-filter)"/>
        <circle cx="90"  cy="18"  r="4"  fill="var(--cyan)"/>
        <circle cx="148" cy="110" r="10" fill="var(--s2)" stroke="var(--violet)" strokeWidth="1.2" filter="url(#glow-filter)"/>
        <circle cx="148" cy="110" r="4"  fill="var(--violet)"/>
        <circle cx="32"  cy="110" r="10" fill="var(--s2)" stroke="var(--blue)" strokeWidth="1.2" filter="url(#glow-filter)"/>
        <circle cx="32"  cy="110" r="4"  fill="var(--blue)"/>
        <circle r="2.2" fill="var(--green)" filter="url(#glow-filter)">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 90 80 L 90 18 L 90 80"/>
        </circle>
        <circle r="2.2" fill="var(--cyan)" filter="url(#glow-filter)">
          <animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M 90 80 L 148 110 L 90 80"/>
        </circle>
        <circle r="2.2" fill="var(--violet)" filter="url(#glow-filter)">
          <animateMotion dur="3.5s" repeatCount="indefinite" begin="2s" path="M 90 80 L 32 110 L 90 80"/>
        </circle>
      </svg>
    </div>
  );
}

/* ── Magnetic CTA ── */
function MagneticBtn({ children, type = 'button', loading }) {
  const wrapRef = useRef(null);
  const btnRef  = useRef(null);

  const onMove = (e) => {
    if (loading) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    btnRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { if (btnRef.current) btnRef.current.style.transform = 'translate(0,0)'; };

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <button
        ref={btnRef}
        type={type}
        disabled={loading}
        style={{
          width: '100%', padding: '17px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'var(--grad-main)',
          backgroundSize: '200% 100%',
          backgroundPosition: '0% 50%',
          borderRadius: 16,
          fontSize: 16, fontWeight: 800, color: 'var(--on-accent)',
          letterSpacing: '-0.01em',
          boxShadow: '0 10px 26px color-mix(in oklch, var(--green) 28%, transparent), 0 2px 4px color-mix(in oklch, var(--text) 8%, transparent)',
          transition: 'transform 0.4s var(--ease-spring), box-shadow 0.3s, background-position 0.6s',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 14px 34px color-mix(in oklch, var(--green) 34%, transparent), 0 4px 8px color-mix(in oklch, var(--text) 10%, transparent)';
          e.currentTarget.style.backgroundPosition = '100% 50%';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 10px 26px color-mix(in oklch, var(--green) 28%, transparent), 0 2px 4px color-mix(in oklch, var(--text) 8%, transparent)';
          e.currentTarget.style.backgroundPosition = '0% 50%';
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: '2.5px solid color-mix(in oklch, var(--on-accent) 45%, transparent)', borderTopColor: 'var(--on-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
            Authenticating
          </>
        ) : (
          <>
            {children}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

/* ── Blocked screen ── */
function AlreadyPlayed({ reason }) {
  const message = {
    device_registered: 'This device has already participated. Each device can play only once.',
    ip_registered:    'This network has already been used. One player per network.',
    username_taken:   'This username is already taken — pick a different one.',
  }[reason] || 'You have already participated.';

  return (
    <div className="screen-centered" style={{ padding: '24px', textAlign: 'center', animation: 'fadeUp 0.5s var(--ease-out)' }}>
      <NetTopology />
      <div style={{
        marginTop: 24, width: 64, height: 64, borderRadius: 20,
        background: 'var(--bg2)', border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 16px',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="5" y="12" width="18" height="13" rx="3" stroke="var(--text3)" strokeWidth="1.6"/>
          <path d="M9 12V9a5 5 0 0110 0v3" stroke="var(--text3)" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8, color: 'var(--text)' }}>
        Access Denied
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 20px' }}>
        {message}
      </p>
      <div style={{ padding: '10px 20px', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <span className="label">CHALLENGE CLOSED</span>
      </div>
    </div>
  );
}

export default function WelcomeScreen({ onContinue }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fingerprint, setFp]    = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmit] = useState(false);
  const [blocked, setBlocked]   = useState(null);
  const [showScan, setShowScan] = useState(true);

  const isAdmin = username.trim().toLowerCase() === ADMIN_USERNAME;

  // App.jsx already ran syncUser() before mounting this screen, so we know the
  // device is NOT yet registered. We just need the fingerprint for the eventual
  // /api/register call.
  useEffect(() => {
    const t = setTimeout(() => setShowScan(false), 2400);
    getFingerprint().then(setFp);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser) { setError('Username required'); return; }
    if (!USERNAME_RE.test(trimmedUser)) { setError('3–20 chars: letters, digits, _ . -'); return; }
    if (!isAdmin && !fingerprint) { setError('Device check still loading — try again'); return; }

    setSubmit(true);
    setError('');

    if (isAdmin) {
      if (!password.trim()) { setError('Admin password required'); setSubmit(false); return; }
      try {
        const res = await fetch('/api/leaderboard', {
          headers: { Authorization: `Bearer ${password}` },
          cache: 'no-store',
        });
        if (res.status === 401) { setError('Incorrect admin password'); setSubmit(false); return; }
        if (!res.ok) { setError('Server error — try again'); setSubmit(false); return; }
      } catch {
        setError('Could not reach server'); setSubmit(false); return;
      }
      sessionStorage.setItem('sns_admin_token', password);
      localStorage.setItem('sns_user', ADMIN_USERNAME);
      onContinue(ADMIN_USERNAME);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ username: trimmedUser, fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'already_registered') {
          // Username collision is a recoverable error — show inline, let them retry
          if (data.field === 'username') {
            setError('This username is already taken — pick another');
            return;
          }
          // Device or IP collision is permanent — show the block screen
          setBlocked(data.field === 'ip' ? 'ip_registered' : 'device_registered');
          return;
        }
        setError('Could not register — try again');
        return;
      }
      localStorage.setItem('sns_user', trimmedUser);
      onContinue(trimmedUser);
    } catch {
      setError('Could not reach server');
    } finally {
      setSubmit(false);
    }
  };

  if (blocked) return <AlreadyPlayed reason={blocked} />;

  return (
    <div className="screen-centered" style={{ padding: '20px 22px', position: 'relative', gap: 0 }}>
      {showScan && <div className="scan-line" />}

      {/* Top badge */}
      <div style={{ textAlign: 'center', marginBottom: 20, animation: 'fadeDown 0.6s var(--ease-out)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 100,
          background: 'var(--bg2)', border: '1px solid var(--b1)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span className="dot dot-g" style={{ width: 6, height: 6 }}></span>
          <span className="label" style={{ color: 'var(--green-dim)', fontSize: 9 }}>
            SNS · NETWORK GAMES
          </span>
        </span>
      </div>

      {/* Network topology */}
      <div style={{ animation: 'scaleIn 0.7s var(--ease-out) 0.1s both' }}>
        <NetTopology />
      </div>

      {/* Display headline */}
      <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 10, animation: 'fadeUp 0.7s var(--ease-out) 0.2s both' }}>
        <div className="display grad-text">NETWORK</div>
        <div className="display" style={{ color: 'var(--text)' }}>CHALLENGE</div>
      </div>

      {/* Subtitle */}
      <p style={{
        fontSize: 14, color: 'var(--text2)', textAlign: 'center',
        lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px',
        animation: 'fadeUp 0.7s var(--ease-out) 0.3s both',
      }}>
        Test your networking knowledge.<br/>Two games. One shot. No retries.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          animation: 'fadeUp 0.7s var(--ease-out) 0.4s both',
          width: '100%', maxWidth: 380, margin: '0 auto',
        }}
      >
        <div>
          <label className="label" style={{ display: 'block', marginBottom: 8 }}>
            Choose a username
          </label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            placeholder="your_name"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={20}
            autoFocus
            style={{
              width: '100%', padding: '15px 18px',
              background: 'var(--bg2)', border: '1px solid var(--b2)',
              borderRadius: 14, fontSize: 16, color: 'var(--text)',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.25s, box-shadow 0.25s',
            }}
          />
          {error && (
            <div style={{
              fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              animation: 'fadeUp 0.25s var(--ease-out)',
            }}>
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ animation: 'popIn 0.3s var(--ease-spring)' }}>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>
              Admin password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', padding: '15px 18px',
                background: 'var(--bg2)', border: '1px solid color-mix(in oklch, var(--violet) 38%, transparent)',
                borderRadius: 14, fontSize: 16, color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 4px 16px color-mix(in oklch, var(--violet) 10%, transparent)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
            />
          </div>
        )}

        <MagneticBtn type="submit" loading={submitting}>
          Connect
        </MagneticBtn>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, animation: 'fadeUp 0.7s var(--ease-out) 0.5s both' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.08em' }}>
          ONE ATTEMPT PER DEVICE · SCORES FINAL
        </span>
      </div>
    </div>
  );
}
