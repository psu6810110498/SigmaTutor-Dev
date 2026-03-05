import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import passport from 'passport';
import './strategies/google.strategy.js';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import cookieParser from 'cookie-parser';
import scheduleRoutes from './routes/schedule.routes.js';
import { getRedisClient, closeRedisClient } from './lib/redis.client.js';
import { prisma } from '@sigma/db';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialise Redis connection eagerly on startup
getRedisClient();

// 1. CORS Middleware (must run before any routes)
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  })
);

// Mount schedule routes after CORS so preflight responses are handled
app.use('/api/schedules', scheduleRoutes);

// 2. Body Parser
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. General Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(apiLimiter);
app.use(passport.initialize());

// 4. Health check — reports DB + Redis connectivity
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database ping
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis ping
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = 'ok';
    } else {
      checks.redis = 'error';
    }
  } catch {
    checks.redis = 'error';
  }

  const isHealthy = Object.values(checks).every((v) => v === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'sigma-backend',
    checks,
    uptime: Math.floor(process.uptime()),
  });
});

// 5. API routes
app.use('/api', routes);

// 6. Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Sigma API', version: '0.1.0' });
});

// 7. Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});

// 9. Graceful shutdown — close Redis + DB connections cleanly
async function shutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await closeRedisClient();
    await prisma.$disconnect();
    console.log('✅ Clean shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));