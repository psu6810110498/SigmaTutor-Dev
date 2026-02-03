import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined in environment variables');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
