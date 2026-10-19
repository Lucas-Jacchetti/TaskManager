import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import {
  clearToken,
  getToken,
  setUnauthorizedHandler,
} from './lib/http';

vi.mock('./features/auth/LoginPage', () => ({
  LoginPage: ({ onLogin }: { onLogin: () => void }) => (
    <div>
      <h1>Página de login</h1>
      <button onClick={onLogin}>Entrar</button>
    </div>
  ),
}));

vi.mock('./features/tasks/WeekPage', () => ({
  WeekPage: ({ onLogout }: { onLogout: () => void }) => (
    <div>
      <h1>Página de tarefas</h1>
      <button onClick={onLogout}>Sair</button>
    </div>
  ),
}));

vi.mock('./lib/http', () => ({
  clearToken: vi.fn(),
  getToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/login');
    vi.mocked(getToken).mockReturnValue(null);
  });

  it('renderiza a página de login quando não há token', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('redireciona /tasks para /login quando não há autenticação', async () => {
    window.history.pushState({}, '', '/tasks');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
  });

  it('redireciona /login para /tasks quando já existe token', async () => {
    vi.mocked(getToken).mockReturnValue('token-123');
    window.history.pushState({}, '', '/login');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/tasks'));
    expect(screen.getByRole('heading', { name: 'Página de tarefas' })).toBeInTheDocument();
  });

  it('redireciona para /tasks após o login', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(window.location.pathname).toBe('/tasks'));
    expect(screen.getByRole('heading', { name: 'Página de tarefas' })).toBeInTheDocument();
  });

  it('limpa o token e redireciona para /login ao sair', async () => {
    vi.mocked(getToken).mockReturnValue('token-123');
    window.history.pushState({}, '', '/tasks');

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(clearToken).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
  });

  it('redireciona para /login quando a sessão expira', async () => {
    vi.mocked(getToken).mockReturnValue('token-123');
    window.history.pushState({}, '', '/tasks');

    render(<App />);
    const unauthorizedHandler = vi.mocked(setUnauthorizedHandler).mock.calls[0][0];

    await act(async () => {
      unauthorizedHandler();
    });

    expect(window.location.pathname).toBe('/login');
    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
  });

  it('redireciona uma rota desconhecida conforme a autenticação', async () => {
    window.history.pushState({}, '', '/rota-inexistente');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
  });
});
