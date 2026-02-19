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

// Helper to set cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Use 'none' if backend/frontend on different domains and secure is true
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

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

    // Set Cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Redirect to frontend (No info in URL needed now)
    res.redirect('http://localhost:3000/login-success');
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
      const result = await authService.register(req.body); // Check return type of register
      // Assuming register returns { user, accessToken, refreshToken } or similar.
      // Based on current implementation, it seems to return User object only? 
      // Let's assume for now we need to login after register or register returns tokens.
      // Wait, previous code: const user = await authService.register(req.body); res.json({data: user})
      // If register doesn't return tokens, we can't set cookies yet. 
      // Standard flow: Register -> Login. Or Register -> Auto Login.
      // Keeping existing flow: Register returns User. User must login.
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully. Please login.',
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

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      success: true,
      data: { user: result.user }, // Only return user info, tokens are in cookies
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      error: message,
    });
  }
});

// ... (Forgot/Reset Password unchanged) ...

/**
 * POST /api/auth/refresh
 */
router.post(
  '/refresh',
  async (req: Request, res: Response): Promise<void> => { // Removed validation schema if it checks body.refreshToken
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error('No refresh token provided');

      const tokens = await authService.refreshToken(refreshToken);

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.json({
        success: true,
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
// ...
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch {
    // Even if DB fails, clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

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