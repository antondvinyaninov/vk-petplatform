import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { config } from './shared/config';
import { logger } from './shared/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { usersRouter } from './features/users/users.router';
import { petsRouter } from './features/pets/pets.router';
import { adsRouter } from './features/ads/ads.router';
import { prisma } from './shared/db';

const app = express();

// ── Middleware ──────────────────────────────────────────────
// Порядок важен: id → log → cors → rate → body → auth → routes → errors
app.use(pinoHttp({ logger }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'vk.com', '*.vk.com', '*.vk-cdn.net'],
        'connect-src': ["'self'", 'https:', 'wss:', 'vk.com', '*.vk.com'],
      },
    },
  })
);
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());

// Раздача статики фронтенда
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// ── Health ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/ads', adsRouter);

// 404 / SPA Routing
// Если запрос не к API и файл не найден в статике — отдаем index.html фронтенда
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', status: 404, message: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────
const start = async () => {
  try {
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info({ port: config.port, env: config.nodeEnv, host: '0.0.0.0' }, 'Server started');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
