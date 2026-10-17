import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:senha@host/db',
    JWT_SECRET: 'x'.repeat(32),
  };

  it('aceita a configuração completa', () => {
    expect(validateEnv(valid)).toBe(valid);
  });

  it.each(['DATABASE_URL', 'JWT_SECRET'])('exige %s', (key) => {
    expect(() => validateEnv({ ...valid, [key]: undefined })).toThrow(key);
  });

  it('rejeita um JWT_SECRET curto', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow(
      'ao menos 32 caracteres',
    );
  });
});