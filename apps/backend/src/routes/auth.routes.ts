import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
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
 * Login and get tokens
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
 * POST /api/auth/refresh
 * Refresh access token
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
 * Logout and invalidate refresh token
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
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
