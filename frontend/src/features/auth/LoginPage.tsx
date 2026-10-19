import { useState, type FormEvent } from 'react';
import { errorMessage, setToken } from '../../lib/http';
import { authApi } from './api';

const inputClass =
  'rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await authApi.register(name, email, password);
      }
      const { access_token } = await authApi.login(email, password);
      setToken(access_token);
      onLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">
          {isRegister ? 'Criar conta' : 'Entrar'}
        </h1>

        {isRegister && (
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nome
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          E-mail
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Senha
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            minLength={8}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="cursor-pointer text-sm text-emerald-600 hover:underline"
        >
          {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
        </button>
      </form>
    </main>
  );
}