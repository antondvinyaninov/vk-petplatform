// src/shared/db/index.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('error', (e: any) => {
  logger.error({ message: e.message }, 'Prisma error');
});
