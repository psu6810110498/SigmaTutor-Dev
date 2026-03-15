import express from 'express';
import type { Request, Response } from 'express';
import passport from 'passport';
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema.js';
import { prisma } from '@sigma/db'; // 🌟 เพิ่มการนำเข้า prisma สำหรับอัปเดตเวลา

const router: express.Router = express.Router();

// Google Authentication
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'], prompt: 'select_account' }));

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login' }), (req, res) => {
    const tokens = req.user as any;
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.redirect('http://localhost:3000/login-success');
});

// Authentication Routes
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

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

router.get('/me', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // 🌟 แอบอัปเดตเวลา พร้อม "ตัวกันชน" ป้องกันระบบล่ม
    try {
      await prisma.user.update({
        where: { id: authReq.user.userId },
        data: { lastActive: new Date() }
      });
    } catch (updateError) {
      console.error("⚠️ ไม่สามารถอัปเดต lastActive ได้:", updateError);
    }

    const user = await authService.getUserById(authReq.user.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, payment: true, data: user });
  } catch (error) {
    console.error("🔥 Auth /me Error:", error); // 🌟 สั่งให้ฟ้อง Error ออกมาตรงๆ
    res.status(500).json({ success: false, error: 'Auth check failed' });
  }
});

export default router;