import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import passport from 'passport';
import './strategies/google.strategy.js'

console.log('🔑 ตรวจสอบ DATABASE_URL:', process.env.DATABASE_URL ? 'เจอแล้ว!' : 'ยังว่างเปล่า...');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // อนุญาตทั้ง localhost และ IP
    credentials: true, // อนุญาตให้ส่ง Cookie/Token มาได้
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Serve uploaded files (Optional fallback if not using R2)
// app.use('/uploads', express.static(path.resolve('uploads')));
// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sigma-backend',
  });
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Sigma API',
    version: '0.1.0',
    docs: '/api',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});