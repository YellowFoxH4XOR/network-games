import { useState, useEffect, useRef } from 'react';
import { getFingerprint } from '../lib/fingerprint.js';

const ADMIN_EMAIL = 'admin@snsdays.com';

/* ── Animated network topology ── */
function NetTopology() {
  return (
    <div style={{ position: 'relative', width: 180, height: 160, margin: '0 auto' }}>
      <svg viewBox="0 0 180 160" fill="none" style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="ng1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00FF87"/>
            <stop offset="50%"  stopColor="#00D4FF"/>
            <stop offset="100%" stopColor="#4F8EF7"/>
          </linearGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="90" cy="80" r="62" stroke="url(#ng1)" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 7"/>
        <circle cx="90" cy="80" r="44" stroke="url(#ng1)" strokeWidth="0.5" opacity="0.10" strokeDasharray="2 6"/>
        <line x1="90"  y1="46"  x2="90"  y2="24"  stroke="#00FF87" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 4"/>
        <line x1="148" y1="110" x2="110" y2="92"  stroke="#00D4FF" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 4"/>
        <line x1="32"  y1="110" x2="70"  y2="92"  stroke="#A855F7" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 4"/>
        <circle cx="90" cy="80" r="18" fill="rgba(0,255,135,0.06)" stroke="url(#ng1)" strokeWidth="1.5" filter="url(#glow-filter)"/>
        <circle cx="90" cy="80" r="6"  fill="#00FF87" opacity="0.9" filter="url(#glow-filter)"/>
        <circle cx="90" cy="80" r="10" fill="none" stroke="#00FF87" strokeWidth="0.5" opacity="0.4" style={{ animation: 'pulse 2s ease infinite' }}/>
        <circle cx="90"  cy="18"  r="10" fill="rgba(0,212,255,0.08)" stroke="#00D4FF" strokeWidth="1" filter="url(#glow-filter)"/>
        <circle cx="90"  cy="18"  r="4"  fill="#00D4FF" opacity="0.8"/>
        <circle cx="148" cy="110" r="10" fill="rgba(168,85,247,0.08)" stroke="#A855F7" strokeWidth="1" filter="url(#glow-filter)"/>
        <circle cx="148" cy="110" r="4"  fill="#A855F7" opacity="0.8"/>
        <circle cx="32"  cy="110" r="10" fill="rgba(79,142,247,0.08)" stroke="#4F8EF7" strokeWidth="1" filter="url(#glow-filter)"/>
        <circle cx="32"  cy="110" r="4"  fill="#4F8EF7" opacity="0.8"/>
        <circle r="2" fill="#00FF87" opacity="0.7" filter="url(#glow-filter)">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 90 80 L 90 18 L 90 80"/>
        </circle>
        <circle r="2" fill="#00D4FF" opacity="0.7" filter="url(#glow-filter)">
          <animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M 90 80 L 148 110 L 90 80"/>
        </circle>
        <circle r="2" fill="#A855F7" opacity="0.7" filter="url(#glow-filter)">
          <animateMotion dur="3.5s" repeatCount="indefinite" begin="2s" path="M 90 80 L 32 110 L 90 80"/>
        </circle>
      </svg>
    </div>
  );
}

/* ── Magnetic CTA button ── */
function MagneticBtn({ children, onClick, type = 'button', disabled, loading }) {
  const wrapRef = useRef(null);
  const btnRef  = useRef(null);

  const onMove = (e) => {
    if (disabled || loading) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.28;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.28;
    btnRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { if (btnRef.current) btnRef.current.style.transform = 'translate(0,0)'; };

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: 'block' }}>
      <button
        ref={btnRef} type={type} onClick={onClick} disabled={disabled || loading}
        style={{
          width: '100%', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: disabled ? 'var(--s3)' : 'var(--grad-main)',
          border: 'none', borderRadius: 16,
          fontSize: 16, fontWeight: 800, color: disabled ? 'var(--text3)' : '#000',
          letterSpacing: '-0.01em',
          boxShadow: disabled ? 'none' : '0 4px 24px rgba(0,255,135,0.30)',
          transition: 'transform 0.4s var(--ease-spring), box-shadow 0.3s, background 0.3s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/>
            Checking...
          </>
        ) : children}
        {!loading && !disabled && (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

/* ── Already played screen ── */
function AlreadyPlayed({ reason }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 24px', textAlign: 'center', animation: 'fadeUp 0.6s var(--ease-out)' }}>
      <NetTopology />
      <div style={{ marginTop: 24, width: 72, height: 72, borderRadius: 22, background: 'var(--s2)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 20px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="14" width="20" height="14" rx="4" stroke="var(--text3)" strokeWidth="1.5"/>
          <path d="M10 14v-4a6 6 0 0112 0v4" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10, color: 'var(--text)' }}>
        Access Denied
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, maxWidth: 280, marginBottom: 28 }}>
        {reason === 'device_registered'
          ? 'This device has already participated. Each device can only play once.'
          : 'This email has already been used. Each player gets one attempt.'}
      </p>
      <div style={{ padding: '14px 24px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14 }}>
        <span className="label">CHALLENGE CLOSED FOR THIS DEVICE</span>
      </div>
    </div>
  );
}

export default function WelcomeScreen({ onContinue }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [ip, setIp]             = useState('');
  const [fingerprint, setFp]    = useState('');
  const [error, setError]       = useState('');
  const [ipLoading, setIpLoad]  = useState(true);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmit] = useState(false);
  const [blocked, setBlocked]   = useState(null);
  const [booted, setBooted]     = useState(false);
  const [showScan, setShowScan] = useState(true);

  const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const t1 = setTimeout(() => setShowScan(false), 2600);
    const t2 = setTimeout(() => setBooted(true), 400);

    // Fetch IP and fingerprint in parallel
    const initPromise = Promise.all([
      fetch('https://api.ipify.org?format=json')
        .then(r => r.json()).then(d => d.ip)
        .catch(() => 'unavailable'),
      getFingerprint(),
    ]).then(([detectedIp, fp]) => {
      setIp(detectedIp);
      setIpLoad(false);
      setFp(fp);

      // Store fp in localStorage for rehydration
      localStorage.setItem('sns_fp', fp);

      // Admin bypasses device check entirely
      const savedEmail = localStorage.getItem('sns_user_email') || '';
      if (savedEmail === ADMIN_EMAIL) {
        setChecking(false);
        return;
      }

      // Check device against backend
      return fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, ip: detectedIp }),
      })
        .then(r => r.json())
        .catch(() => ({ allowed: true })); // fail open if API is down
    }).then(result => {
      if (result && !result.allowed) {
        setBlocked(result.reason || 'device_registered');
      }
      setChecking(false);
    });

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address'); return; }

    setSubmit(true);
    setError('');

    // Admin: verify password against server before granting access
    if (isAdmin) {
      if (!password.trim()) { setError('Admin password required'); setSubmit(false); return; }
      try {
        const res = await fetch('/api/leaderboard', {
          headers: { Authorization: `Bearer ${password}` },
        });
        if (res.status === 401) { setError('Incorrect admin password'); setSubmit(false); return; }
        if (!res.ok) { setError('Server error — try again'); setSubmit(false); return; }
      } catch {
        setError('Could not reach server'); setSubmit(false); return;
      }
      sessionStorage.setItem('sns_admin_token', password);
      localStorage.setItem('sns_user_email', email);
      onContinue(email);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fingerprint, ip }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'already_registered') {
          if (data.field === 'email') {
            setBlocked('email_taken');
          } else {
            setBlocked('device_registered');
          }
          return;
        }
        // Server error — still allow through (fail open)
        console.warn('Register API error — allowing through:', data.error);
      }

      localStorage.setItem('sns_user_email', email);
      localStorage.setItem('sns_user_ip', ip);
      onContinue(email);
    } catch (err) {
      // API unavailable (local dev / network error) — fail open
      console.warn('Register API unavailable — allowing through');
      localStorage.setItem('sns_user_email', email);
      localStorage.setItem('sns_user_ip', ip);
      onContinue(email);
    } finally {
      setSubmit(false);
    }
  };

  // ── Already blocked ──
  if (blocked) return <AlreadyPlayed reason={blocked} />;

  // ── Boot / checking screen ──
  if (checking) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, padding: 24 }}>
        {showScan && <div className="scan-line" />}
        <NetTopology />
        <div style={{ textAlign: 'center' }}>
          <div className="label" style={{ color: 'var(--green)', marginBottom: 12 }}>
            ◈&nbsp;&nbsp;AUTHENTICATING DEVICE&nbsp;&nbsp;◈
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--green)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      {showScan && <div className="scan-line" />}

      <div style={{ textAlign: 'center', marginBottom: 32, opacity: booted ? 1 : 0, transition: 'opacity 0.6s', animation: booted ? 'fadeDown 0.6s var(--ease-out)' : 'none' }}>
        <span className="label" style={{ color: 'var(--green)', letterSpacing: '0.2em' }}>
          ◈&nbsp;&nbsp;SNS · NETWORK GAMES&nbsp;&nbsp;◈
        </span>
      </div>

      <div style={{ opacity: booted ? 1 : 0, transition: 'opacity 0.8s 0.1s', animation: booted ? 'scaleIn 0.8s var(--ease-out) 0.1s both' : 'none' }}>
        <NetTopology />
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 12, opacity: booted ? 1 : 0, animation: booted ? 'fadeUp 0.7s var(--ease-out) 0.2s both' : 'none' }}>
        <div className="display grad-text">NETWORK</div>
        <div className="display" style={{ color: 'var(--text)', WebkitTextFillColor: 'var(--text)' }}>CHALLENGE</div>
      </div>

      <p style={{ fontSize: 15, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.65, maxWidth: 300, margin: '0 auto 32px', opacity: booted ? 1 : 0, animation: booted ? 'fadeUp 0.7s var(--ease-out) 0.35s both' : 'none' }}>
        Test your networking knowledge.<br/>Two games. One shot. No retries.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ opacity: booted ? 1 : 0, animation: booted ? 'fadeUp 0.7s var(--ease-out) 0.45s both' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="label" style={{ display: 'block', marginBottom: 10 }}>
            Enter email to authenticate
          </label>
          <input
            type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com"
            autoFocus
            style={{
              width: '100%', padding: '16px 18px',
              background: 'var(--s1)', border: '1px solid var(--b2)',
              borderRadius: 14, fontSize: 16, color: 'var(--text)',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* Password field — only visible for admin email */}
        {isAdmin && (
          <div style={{ animation: 'scaleIn 0.25s var(--ease-spring)' }}>
            <label className="label" style={{ display: 'block', marginBottom: 10 }}>
              Admin password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', padding: '16px 18px',
                background: 'var(--s1)', border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 14, fontSize: 16, color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            />
          </div>
        )}

        <MagneticBtn type="submit" loading={submitting}>
          Connect to Network
        </MagneticBtn>
      </form>

      <div style={{ textAlign: 'center', marginTop: 28, opacity: booted ? 1 : 0, animation: booted ? 'fadeUp 0.7s var(--ease-out) 0.55s both' : 'none' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.08em' }}>
          ONE ATTEMPT PER DEVICE · SCORES ARE FINAL
        </span>
      </div>
    </div>
  );
}
