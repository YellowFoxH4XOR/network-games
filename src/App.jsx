import { useState, useCallback } from 'react';
import Background, { CursorGlow } from './components/Background.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import Quiz from './components/Quiz.jsx';
import WordSearch from './components/WordSearch.jsx';
import AdminView from './components/AdminView.jsx';

const ADMIN_USERNAME = 'admin';

export default function App() {
  const savedUser = localStorage.getItem('sns_user') || '';
  const [screen, setScreen] = useState(() => {
    if (!savedUser) return 'welcome';
    if (savedUser === ADMIN_USERNAME) return 'admin';
    return 'landing';
  });
  const [user, setUser] = useState(savedUser);
  const [fade, setFade] = useState('fadeUp');

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
    localStorage.removeItem('sns_user');
    sessionStorage.removeItem('sns_admin_token');
    setUser('');
    nav('welcome');
  }, [nav]);

  return (
    <>
      <Background />
      <CursorGlow />
      <div style={{ animation: `${fade} 0.4s var(--ease-out)`, minHeight: '100dvh' }}>
        {screen === 'welcome'    && <WelcomeScreen onContinue={handleLogin} />}
        {screen === 'landing'    && <LandingPage username={user} onSelectGame={g => nav(g)} />}
        {screen === 'quiz'       && <Quiz username={user} onBack={() => nav('landing')} />}
        {screen === 'wordsearch' && <WordSearch username={user} onBack={() => nav('landing')} />}
        {screen === 'admin'      && <AdminView onLogout={handleLogout} />}
      </div>
    </>
  );
}
