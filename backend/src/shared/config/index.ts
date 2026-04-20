// src/shared/config/index.ts
// Централизованная конфигурация — fail fast при отсутствии обязательных переменных

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function intEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  return value ? parseInt(value, 10) : defaultValue;
}

export const config = {
  port: intEnv('PORT', 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  database: {
    url: requiredEnv('DATABASE_URL'),
  },

  vk: {
    appSecret: requiredEnv('VK_APP_SECRET'),
    appId: intEnv('VK_APP_ID', 0),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
} as const;
