import { beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../lib/http';
import { authApi } from './api';

vi.mock('../../lib/http', () => ({ request: vi.fn() }));

describe('authApi', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(request).mockResolvedValue(undefined);
  });

  it('login envia e-mail e senha por POST', async () => {
    await authApi.login('ana@exemplo.com', 'senha-segura-123');

    expect(request).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ana@exemplo.com',
        password: 'senha-segura-123',
      }),
    });
  });

  it('register envia nome, e-mail e senha por POST', async () => {
    await authApi.register('Ana', 'ana@exemplo.com', 'senha-segura-123');

    expect(request).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ana',
        email: 'ana@exemplo.com',
        password: 'senha-segura-123',
      }),
    });
  });

  it('me consulta o usuário autenticado', async () => {
    await authApi.me();

    expect(request).toHaveBeenCalledWith('/auth/me');
  });
});