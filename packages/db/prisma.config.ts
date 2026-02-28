import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema'),
  migrate: {
    async adapter() {
      // directUrl is used for migrate commands (bypasses connection pooler)
      // This is required for Neon because the pooler doesn't support advisory locks
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      });
      const { PrismaPg } = await import('@prisma/adapter-pg');
      return new PrismaPg(pool);
    },
  },
});
