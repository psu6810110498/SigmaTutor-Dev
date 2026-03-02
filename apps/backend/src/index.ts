import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index.js'; // เติม .js เพื่อความเสถียร
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import passport from 'passport';
import './strategies/google.strategy.js';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import cookieParser from 'cookie-parser';
import scheduleRoutes from './routes/schedule.routes.js';

console.log('🔑 ตรวจสอบ DATABASE_URL:', process.env.DATABASE_URL ? 'เจอแล้ว!' : 'ยังว่างเปล่า...');
const app = express();
const PORT = process.env.PORT || 4000;
app.use('/api/schedules', scheduleRoutes);
// 1. CORS Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  })
);

// 2. Body Parser (รวม Stripe Webhook และขยาย Limit สำหรับรูป Profile)
app.use((req, res, next) => {
  // ตรวจสอบ Webhook ของ Stripe (ใช้ /api ปกติไม่มี v1)
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    // ขยายเป็น 10mb เพื่อรองรับระบบ Profile ใหม่
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. General Middleware (จากระบบ Auth ใหม่)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(apiLimiter);
app.use(passport.initialize());

// 4. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sigma-backend',
  });
});

// 5. API routes (กลับมาใช้ /api ตามเดิม)
app.use('/api', routes); 

// 6. Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Sigma API',
    version: '0.1.0',
    docs: '/api', // แก้เป็น /api
  });
});

// 7. Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api`); 
});