import express from 'express';
import type { Request, Response } from 'express';
import passport from 'passport'; // ✅ เพิ่มการนำเข้า passport
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema.js';

// กำหนด Router พร้อมระบุ Type
const router: express.Router = express.Router();

/**
 * ✅ NEW: GET /api/auth/google
 * ประตูที่ 1: ส่งผู้ใช้งานไปยังหน้าล็อกอินของ Google
 */
router.get(
  '/google', 
  passport.authenticate('google', { 
    session: false, 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

/**
 * ✅ NEW: GET /api/auth/google/callback
 * ประตูที่ 2: รับข้อมูลกลับมาจาก Google หลังจากผู้ใช้งานล็อกอินสำเร็จ
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: 'http://localhost:3000/login' 
  }),
  (req, res) => {
    // ข้อมูล Token ที่ได้จาก authService.validateGoogleUser จะอยู่ที่ req.user
    const tokens = req.user as any;
    
    // ส่ง Token กลับไปยังหน้าบ้าน (Frontend) ผ่าน URL เพื่อให้หน้าบ้านนำไปเก็บลง LocalStorage
    // เราจะส่งไปยังหน้า /login-success เพื่อจัดการ Token เหล่านี้ครับ
    res.redirect(
      `http://localhost:3000/login-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  }
);

/**
 * POST /api/auth/register
 * ลงทะเบียนผู้ใช้งานใหม่
 */
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * POST /api/auth/login
 * เข้าสู่ระบบ
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset password failed';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/auth/refresh
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tokens = await authService.refreshToken(req.body.refreshToken);
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  res.json({
    success: true,
    data: authReq.user,
  });
});

export default router;