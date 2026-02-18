import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import passport from 'passport';
import './strategies/google.strategy.js'
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import cookieParser from 'cookie-parser';

console.log('🔑 ตรวจสอบ DATABASE_URL:', process.env.DATABASE_URL ? 'เจอแล้ว!' : 'ยังว่างเปล่า...');
const app = express();
const PORT = process.env.PORT || 4000;

// 1. CORS Middleware
// ใน apps/backend/src/index.ts

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // เพิ่ม PATCH ตรงนี้
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ 2. Body Parser (ปรับแก้: ย้าย limit ขึ้นมาไว้ตรงนี้เพื่อให้รองรับรูปภาพ Profile)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// 3. General Middleware
app.use(cookieParser());
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

// 5. API routes
app.use('/api', routes);

// 6. Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Sigma API',
    version: '0.1.0',
    docs: '/api',
  });
});

// 7. Error handling (ย้าย Body Parser ที่เกินออกไปแล้ว)
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});