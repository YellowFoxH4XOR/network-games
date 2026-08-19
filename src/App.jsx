import { useState, useCallback, useEffect } from 'react';
import Background, { CursorGlow } from './components/Background.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import Quiz from './components/Quiz.jsx';
import WordSearch from './components/WordSearch.jsx';
import MemoryMatch from './components/MemoryMatch.jsx';
import SpinWheel from './components/SpinWheel.jsx';
import ZtpBasketball from './components/ZtpBasketball.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import AdminView from './components/AdminView.jsx';
import { syncUser, clearLocalSession } from './lib/syncUser.js';
import { getFingerprint } from './lib/fingerprint.js';
import { validateCode, registerForStall, setActiveStall, clearActiveStall } from './lib/stall.js';

const ADMIN_USERNAME = 'admin';

function BootingScreen() {
  return (
    <div className="screen-centered" style={{ alignItems: 'center', gap: 18, padding: 24, position: 'relative' }}>
      <div className="scan-line" />
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--r-lg)', background: 'var(--bg2)',
        border: '1px solid var(--b1)', boxShadow: 'var(--glow-green), var(--shadow-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'float 3s ease-in-out infinite',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="5" fill="var(--green-glow)" stroke="var(--green)" strokeWidth="1.5"/>
          <circle cx="14" cy="14" r="2" fill="var(--green)"/>
          <circle cx="14" cy="14" r="11" fill="none" stroke="var(--green)" strokeWidth="0.6" opacity="0.3" strokeDasharray="3 4"
            style={{ animation: 'spin 8s linear infinite', transformOrigin: '14px 14px' }}/>
        </svg>
      </div>
      <div className="label" style={{ color: 'var(--green-dim)' }}>
        ◈&nbsp;&nbsp;SYNCING WITH SERVER&nbsp;&nbsp;◈
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
            animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('booting');
  const [user, setUser]     = useState('');
  const [stall, setStall]   = useState(null);   // { slug, name } | null
  const [fade, setFade]     = useState('screenIn');

  // Boot sync: reconcile localStorage with the database
  useEffect(() => {
    let cancelled = false;
    syncUser().then(result => {
      if (cancelled) return;
      if (result.kind === 'admin') {
        setUser(ADMIN_USERNAME);
        setScreen('admin');
      } else if (result.kind === 'registered') {
        setUser(result.username);
        setStall({ slug: result.stall, name: result.stallName });
        setScreen('landing');
      } else if (result.kind === 'offline' && result.username && result.stall) {
        // API unreachable — best-effort fallback to local data
        setUser(result.username);
        setStall({ slug: result.stall, name: result.stallName });
        setScreen('landing');
      } else {
        setUser('');
        setScreen('welcome');
      }
    });
    return () => { cancelled = true; };
  }, []);

  const nav = useCallback((dest) => {
    setFade('screenOut');
    setTimeout(() => { setScreen(dest); setFade('screenIn'); }, 180);
  }, []);

  const handleLogin = useCallback((u, enteredStall) => {
    setUser(u);
    if (u === ADMIN_USERNAME) {
      nav('admin');
    } else {
      setStall(enteredStall);
      nav('landing');
    }
  }, [nav]);

  // Switch stalls from a new code: validate → register for it → swap.
  // Returns { ok } or { error } so the caller can show an inline message.
  const changeStall = useCallback(async (code) => {
    let v;
    try { v = await validateCode(code); }
    catch { return { error: 'Could not reach the server' }; }
    if (!v.valid) return { error: 'That code isn’t valid' };
    if (stall && v.stall.slug === stall.slug) {
      return { error: `You’re already in ${v.stall.name}` };
    }

    const fp = await getFingerprint();
    const r = await registerForStall(user, fp, v.stall.slug);
    // 409 'device' just means this device already played that stall — that's
    // fine, we still switch them in to view it. 'username' means the name is
    // taken by someone else in that stall.
    if (!r.ok && r.error === 'already_registered' && r.field === 'username') {
      return { error: `“${user}” is taken in ${v.stall.name}` };
    }
    if (!r.ok && r.error && r.error !== 'already_registered') {
      return { error: 'Could not switch stalls — try again' };
    }

    setActiveStall(v.stall);
    setStall(v.stall);
    nav('landing');
    return { ok: true, stall: v.stall };
  }, [user, stall, nav]);

  const handleLogout = useCallback(() => {
    clearLocalSession();
    clearActiveStall();
    setUser('');
    setStall(null);
    nav('welcome');
  }, [nav]);

  return (
    <>
      <Background />
      <CursorGlow />
      <div style={{ animation: `${fade} 0.34s var(--ease-out)`, minHeight: '100dvh' }}>
        {screen === 'booting'    && <BootingScreen />}
        {screen === 'welcome'    && <WelcomeScreen onContinue={handleLogin} />}
        {screen === 'landing'    && <LandingPage username={user} stall={stall} onSelectGame={g => nav(g)} onChangeStall={changeStall} />}
        {screen === 'quiz'       && <Quiz username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'wordsearch' && <WordSearch username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'memory'     && <MemoryMatch username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'spin'       && <SpinWheel username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'ztp'        && <ZtpBasketball username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'leaderboard' && <Leaderboard username={user} stall={stall} onBack={() => nav('landing')} />}
        {screen === 'admin'      && <AdminView onLogout={handleLogout} />}
      </div>
    </>
  );
}
