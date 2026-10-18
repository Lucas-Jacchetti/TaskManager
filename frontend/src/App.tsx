import { useEffect, useState } from 'react';
import { LoginPage } from './features/auth/LoginPage';
import { WeekPage } from './features/tasks/WeekPage';
import { clearToken, getToken, setUnauthorizedHandler } from './lib/http';

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => getToken() !== null);

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthenticated(false));
  }, []);

  function handleLogout() {
    clearToken();
    setAuthenticated(false);
  }

  return authenticated ? (
    <WeekPage onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={() => setAuthenticated(true)} />
  );
}
