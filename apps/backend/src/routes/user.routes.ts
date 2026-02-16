import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

// ✅ แก้จุดที่ 1: ระบุ Type ให้ชัดเจน
const router: express.Router = express.Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get(
  '/',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    const _req = req as AuthRequest;
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  // ✅ แก้จุดที่ 2: บังคับให้เป็น string (Fix: Type 'string | string[]' is not assignable to type 'string')
  const id = req.params.id as string;

  try {
    // Users can only view their own profile unless admin
    if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PATCH /api/users/:id
 * Update user
 */
router.patch('/:id', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  // ✅ แก้จุดที่ 3: บังคับให้เป็น string
  const id = req.params.id as string;

  try {
    const { name } = req.body;

    // Users can only update their own profile unless admin
    if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete(
  '/:id',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    // ✅ แก้จุดที่ 4: บังคับให้เป็น string
    const id = req.params.id as string;
    
    try {
      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
);

export default router;