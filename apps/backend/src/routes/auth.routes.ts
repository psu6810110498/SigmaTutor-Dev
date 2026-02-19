import express from 'express';
import type { Request, Response } from 'express';
import passport from 'passport';
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema.js';

const router: express.Router = express.Router();

router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'], prompt: 'select_account' }));

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login' }), (req, res) => {
    const tokens = req.user as any;
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.redirect('http://localhost:3000/login-success');
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result, message: 'User registered successfully.' });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, data: { user: result.user } });
  } catch (error: any) { res.status(401).json({ success: false, error: error.message }); }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error('No refresh token provided');
      const tokens = await authService.refreshToken(refreshToken);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.json({ success: true });
    } catch (error: any) { res.status(401).json({ success: false, error: error.message }); }
});

/**
 * POST /api/auth/logout
 * รวมร่าง: ลบ Token ใน DB และเคลียร์ Cookie ใน Browser ทันที
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // ดึง token ได้จากทั้ง body หรือ cookie เพื่อความยืดหยุ่น
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // เคลียร์ cookies ทุกครั้งเพื่อความปลอดภัย
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    // หาก DB มีปัญหา ก็ยังสั่งเคลียร์ cookie ฝั่ง User ให้ครับ
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

/**
 * GET /api/auth/me
 * ดึงข้อมูลผู้ใช้ปัจจุบันพร้อมสถานะ Payment
 */
router.get('/me', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await authService.getUserById(authReq.user.userId);
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      payment: true, // ✅ คงส่วนนี้ไว้ตามที่คุณต้องการ
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Auth check failed' });
  }
});

export default router;