const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];

export function validateEnv(config: Record<string, unknown>) {
  for (const key of REQUIRED) {
    if (!config[key]) {
      throw new Error(`A variável ${key} é obrigatória`);
    }
  }
  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET deve ter ao menos 32 caracteres');
  }
  return config;
}