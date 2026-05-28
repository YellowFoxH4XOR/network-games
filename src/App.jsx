import { useState, useCallback, useEffect } from 'react';
import Background, { CursorGlow } from './components/Background.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import Quiz from './components/Quiz.jsx';
import WordSearch from './components/WordSearch.jsx';
import AdminView from './components/AdminView.jsx';
import { syncUser, clearLocalSession } from './lib/syncUser.js';

const ADMIN_USERNAME = 'admin';

function BootingScreen() {
  return (
    <div className="screen-centered" style={{ alignItems: 'center', gap: 18, padding: 24, position: 'relative' }}>
      <div className="scan-line" />
      <div style={{
        width: 64, height: 64, borderRadius: 20, background: 'var(--bg2)',
        border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
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
            width: 6, height: 6, borderRadius: 3, background: 'var(--green)',
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
  const [fade, setFade]     = useState('fadeUp');

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
        setScreen('landing');
      } else if (result.kind === 'offline' && result.username) {
        // API unreachable — best-effort fallback to local data
        setUser(result.username);
        setScreen(result.username === ADMIN_USERNAME ? 'admin' : 'landing');
      } else {
        setUser('');
        setScreen('welcome');
      }
    });
    return () => { cancelled = true; };
  }, []);

  const nav = useCallback((dest) => {
    setFade('fadeOut');
    setTimeout(() => { setScreen(dest); setFade('fadeUp'); }, 220);
  }, []);

  const handleLogin = useCallback((u) => {
    setUser(u);
    if (u === ADMIN_USERNAME) {
      nav('admin');
    } else {
      nav('landing');
    }
  }, [nav]);

  const handleLogout = useCallback(() => {
    clearLocalSession();
    setUser('');
    nav('welcome');
  }, [nav]);

  return (
    <>
      <Background />
      <CursorGlow />
      <div style={{ animation: `${fade} 0.4s var(--ease-out)`, minHeight: '100dvh' }}>
        {screen === 'booting'    && <BootingScreen />}
        {screen === 'welcome'    && <WelcomeScreen onContinue={handleLogin} />}
        {screen === 'landing'    && <LandingPage username={user} onSelectGame={g => nav(g)} />}
        {screen === 'quiz'       && <Quiz username={user} onBack={() => nav('landing')} />}
        {screen === 'wordsearch' && <WordSearch username={user} onBack={() => nav('landing')} />}
        {screen === 'admin'      && <AdminView onLogout={handleLogout} />}
      </div>
    </>
  );
}
