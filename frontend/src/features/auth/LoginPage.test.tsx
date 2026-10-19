import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { authApi } from './api';
import { errorMessage, setToken } from '../../lib/http';

vi.mock('./api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../../lib/http', () => ({
  errorMessage: vi.fn(() => 'Não foi possível conectar ao servidor.'),
  setToken: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('faz login e salva o token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'token-123' });
    const onLogin = vi.fn();
    const user = userEvent.setup();

    render(<LoginPage onLogin={onLogin} />);
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(authApi.login).toHaveBeenCalledWith('ana@exemplo.com', 'senha-segura');
    expect(setToken).toHaveBeenCalledWith('token-123');
  });

  it('mostra os campos de cadastro e registra antes de fazer login', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      id: '1',
      name: 'Ana',
      email: 'ana@exemplo.com',
    });
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'token-123' });
    const user = userEvent.setup();

    render(<LoginPage onLogin={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Criar uma conta' }));
    await user.type(screen.getByLabelText('Nome'), 'Ana');
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith(
        'Ana',
        'ana@exemplo.com',
        'senha-segura',
      ),
    );
    expect(authApi.login).toHaveBeenCalledWith('ana@exemplo.com', 'senha-segura');
  });

  it('mostra erro quando a autenticação falha', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('falha'));
    vi.mocked(errorMessage).mockReturnValue('Credenciais inválidas');
    const user = userEvent.setup();

    render(<LoginPage onLogin={vi.fn()} />);
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Credenciais inválidas',
    );
    expect(setToken).not.toHaveBeenCalled();
  });

  it('alterna entre login e cadastro preservando o e-mail informado', async () => {
    const user = userEvent.setup();

    render(<LoginPage onLogin={vi.fn()} />);
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Criar uma conta' }));

    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@exemplo.com');
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fazer Login' }));
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  });
});
