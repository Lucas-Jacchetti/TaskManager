import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  clearToken,
  errorMessage,
  getToken,
  request,
  setToken,
  setUnauthorizedHandler,
} from './http';

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error,
  );

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(() => {});
});

describe('token', () => {
  it('guarda, lê e remove o token', () => {
    expect(getToken()).toBeNull();

    setToken('abc');
    expect(getToken()).toBe('abc');

    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('request', () => {
  it('envia JSON e não envia Authorization sem token', async () => {
    const fetchMock = mockFetch(jsonResponse(200, {}));

    await request('/x');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('envia o token no cabeçalho Authorization', async () => {
    setToken('abc');
    const fetchMock = mockFetch(jsonResponse(200, {}));

    await request('/x');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer abc',
    });
  });

  it('repassa método e corpo', async () => {
    const fetchMock = mockFetch(jsonResponse(200, {}));

    await request('/x', { method: 'POST', body: '{"a":1}' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/x');
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{"a":1}');
  });

  it('devolve o JSON da resposta', async () => {
    mockFetch(jsonResponse(200, { ok: true }));

    await expect(request('/x')).resolves.toEqual({ ok: true });
  });

  it('devolve undefined quando a resposta é 204', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(request('/x')).resolves.toBeUndefined();
  });

  it('lança ApiError com a mensagem do corpo', async () => {
    mockFetch(jsonResponse(400, { message: 'Dados inválidos' }));

    const error = await failure(request('/x'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400 });
    expect((error as ApiError).message).toBe('Dados inválidos');
  });

  it('junta as mensagens quando o corpo traz uma lista', async () => {
    mockFetch(jsonResponse(400, { message: ['título vazio', 'tipo inválido'] }));

    const error = await failure(request('/x'));

    expect((error as ApiError).message).toBe('título vazio, tipo inválido');
  });

  it('usa uma mensagem padrão quando o corpo não é JSON', async () => {
    mockFetch(new Response('boom', { status: 500 }));

    const error = await failure(request('/x'));

    expect((error as ApiError).message).toBe('Erro inesperado');
  });

  it('limpa o token e avisa quando uma requisição autenticada volta 401', async () => {
    setToken('abc');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch(jsonResponse(401, { message: 'Unauthorized' }));

    const error = await failure(request('/x'));

    expect(error).toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('não avisa de sessão expirada quando não havia token (login errado)', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch(jsonResponse(401, { message: 'E-mail ou senha inválidos' }));

    await failure(request('/auth/login'));

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('errorMessage', () => {
  it('traduz o limite de requisições (429)', () => {
    expect(errorMessage(new ApiError(429, 'ThrottlerException'))).toBe(
      'Muitas tentativas. Aguarde um minuto.',
    );
  });

  it('usa a mensagem de um ApiError', () => {
    expect(errorMessage(new ApiError(409, 'E-mail já cadastrado'))).toBe(
      'E-mail já cadastrado',
    );
  });

  it('usa uma mensagem de conexão para outros erros', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(
      'Não foi possível conectar ao servidor.',
    );
  });
});