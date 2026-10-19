import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { WeekPage } from './features/tasks/WeekPage';
import { clearToken, getToken, setUnauthorizedHandler } from './lib/http';

function AppRoutes() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(() => getToken() !== null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthenticated(false);
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  function handleLogin() {
    setAuthenticated(true);
    navigate('/tasks', { replace: true });
  }

  function handleLogout() {
    clearToken();
    setAuthenticated(false);
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to="/tasks" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/tasks"
        element={
          authenticated ? (
            <WeekPage onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={authenticated ? '/tasks' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
