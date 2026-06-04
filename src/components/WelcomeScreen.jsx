import { useState, useEffect, useRef } from 'react';
import { getFingerprint } from '../lib/fingerprint.js';
import { validateCode, registerForStall, setActiveStall } from '../lib/stall.js';
import { syncUser } from '../lib/syncUser.js';

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
          background: 'var(--green)',
          border: '2px solid var(--ink)',
          borderRadius: 0,
          fontSize: 16, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.01em',
          boxShadow: '6px 6px 0 0 var(--ink)',
          transition: 'transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '8px 8px 0 0 var(--ink)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--ink)';
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

export default function WelcomeScreen({ onContinue }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode]         = useState('');
  const [fingerprint, setFp]    = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmit] = useState(false);
  const [showScan, setShowScan] = useState(true);
  const [locked, setLocked]     = useState(false);

  const isAdmin = username.trim().toLowerCase() === ADMIN_USERNAME;

  // App.jsx already ran syncUser(), so the device isn't registered for the
  // active stall (if any). But it may have played a DIFFERENT stall and already
  // own a username. Look the device up by fingerprint: if it's a known device,
  // bind to its existing username (pre-fill + lock) so identity stays stable
  // across stalls. A fresh device just gets the fingerprint for /api/register.
  useEffect(() => {
    const t = setTimeout(() => setShowScan(false), 2400);
    let cancelled = false;
    getFingerprint().then(async (fp) => {
      if (cancelled) return;
      setFp(fp);
      try {
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ fingerprint: fp }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.knownDevice && data.username) {
          setUsername(data.username);
          setLocked(true);
        }
      } catch {
        // Offline — leave the field editable; /api/register reconciles later.
      }
    });
    return () => { cancelled = true; clearTimeout(t); };
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

    // A stall code is required for non-admins — validate it first.
    const trimmedCode = code.trim();
    if (!trimmedCode) { setError('Enter your stall code'); setSubmit(false); return; }

    try {
      let v;
      try { v = await validateCode(trimmedCode); }
      catch { setError('Could not reach server'); return; }
      if (!v.valid) { setError('That stall code isn’t valid'); return; }

      const r = await registerForStall(trimmedUser, fingerprint, v.stall.slug);
      if (!r.ok) {
        if (r.error === 'already_registered' && r.field === 'username') {
          // Username collision within this stall — recoverable, let them retry
          setError(`This username is taken in ${v.stall.name} — pick another`);
          return;
        }
        if (r.error === 'already_registered') {
          // This device is already registered for this stall — welcome it back
          // in rather than blocking. syncUser() recovers the DB's username for
          // this device and re-caches its scores, so any completed game shows
          // greyed-out with its final score instead of being playable again.
          setActiveStall(v.stall);
          const synced = await syncUser();
          const u = synced.kind === 'registered' ? synced.username : trimmedUser;
          localStorage.setItem('sns_user', u);
          onContinue(u, v.stall);
          return;
        }
        setError('Could not register — try again');
        return;
      }

      localStorage.setItem('sns_user', trimmedUser);
      setActiveStall(v.stall);
      onContinue(trimmedUser, v.stall);
    } catch {
      setError('Could not reach server');
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div className="screen-centered" style={{ padding: '20px 22px', position: 'relative', gap: 0 }}>
      {showScan && <div className="scan-line" />}

      {/* Top badge */}
      <div style={{ textAlign: 'center', marginBottom: 20, animation: 'fadeDown 0.6s var(--ease-out)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 0,
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
      <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 10 }}>
        <div className="display grad-text reveal-up" style={{ animationDelay: '0.15s' }}>NETWORK</div>
        <div className="display reveal-up" style={{ color: 'var(--text)', animationDelay: '0.27s' }}>CHALLENGE</div>
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
            {locked ? 'Your username' : 'Choose a username'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={username}
              onChange={e => { if (locked) return; setUsername(e.target.value); setError(''); }}
              placeholder="your_name"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={20}
              readOnly={locked}
              aria-readonly={locked}
              autoFocus={!locked}
              style={{
                width: '100%', padding: '15px 18px',
                paddingRight: locked ? 44 : 18,
                background: 'var(--bg2)', border: '1px solid var(--b2)',
                borderRadius: 0, fontSize: 16,
                color: locked ? 'var(--text2)' : 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: 'var(--shadow-sm)',
                cursor: locked ? 'not-allowed' : 'text',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
            />
            {locked && (
              <svg
                width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden="true"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}
              >
                <rect x="5" y="12" width="18" height="13" rx="3" stroke="var(--text3)" strokeWidth="1.6"/>
                <path d="M9 12V9a5 5 0 0110 0v3" stroke="var(--text3)" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          {locked && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, letterSpacing: '0.02em' }}>
              Linked to this device from a previous stall — enter the new stall code below.
            </div>
          )}
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

        {!isAdmin && (
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>
              Stall code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="STALL CODE"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              maxLength={32}
              style={{
                width: '100%', padding: '15px 18px',
                background: 'var(--bg2)', border: '1px solid var(--b2)',
                borderRadius: 0, fontSize: 16, color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em',
                boxShadow: 'var(--shadow-sm)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
            />
          </div>
        )}

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
                background: 'var(--bg2)', border: '2px solid var(--ink)',
                borderRadius: 0, fontSize: 16, color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: 'var(--shadow-sm)',
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
          ONE ATTEMPT PER STALL · SCORES FINAL
        </span>
      </div>
    </div>
  );
}
