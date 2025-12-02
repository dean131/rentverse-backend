// @ts-ignore
import { PrismaClient } from '../shared/prisma-client';
import { env } from './env.js';
import logger from './logger.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Kita override URL default dengan yang sudah divalidasi oleh Zod
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    // Log configuration
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    // logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
  });
  
  globalForPrisma.prisma = prisma;
}

export default prisma;