import { useState, useCallback } from 'react';
import Background, { CursorGlow } from './components/Background.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import Quiz from './components/Quiz.jsx';
import WordSearch from './components/WordSearch.jsx';
import AdminView from './components/AdminView.jsx';

const ADMIN_EMAIL = 'admin@snsdays.com';

export default function App() {
  const savedEmail = localStorage.getItem('sns_user_email') || '';
  const [screen, setScreen] = useState(() => {
    if (!savedEmail) return 'welcome';
    if (savedEmail === ADMIN_EMAIL) return 'admin';
    return 'landing';
  });
  const [email, setEmail] = useState(savedEmail);
  const [fade, setFade]   = useState('fadeUp');

  const nav = useCallback((dest) => {
    setFade('fadeOut');
    setTimeout(() => { setScreen(dest); setFade('fadeUp'); }, 220);
  }, []);

  const handleLogin = useCallback((e) => {
    setEmail(e);
    if (e === ADMIN_EMAIL) {
      nav('admin');
    } else {
      nav('landing');
    }
  }, [nav]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('sns_user_email');
    localStorage.removeItem('sns_user_ip');
    sessionStorage.removeItem('sns_admin_token');
    setEmail('');
    nav('welcome');
  }, [nav]);

  return (
    <>
      <Background />
      <CursorGlow />
      <div style={{ animation: `${fade} 0.4s var(--ease-out)`, minHeight: '100dvh' }}>
        {screen === 'welcome' && (
          <WelcomeScreen onContinue={handleLogin} />
        )}
        {screen === 'landing' && (
          <LandingPage email={email} onSelectGame={g => nav(g)} />
        )}
        {screen === 'quiz' && (
          <Quiz email={email} onBack={() => nav('landing')} />
        )}
        {screen === 'wordsearch' && (
          <WordSearch email={email} onBack={() => nav('landing')} />
        )}
        {screen === 'admin' && (
          <AdminView onLogout={handleLogout} />
        )}
      </div>
    </>
  );
}
