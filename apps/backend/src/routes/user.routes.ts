import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user?.userId !== id && req.user?.role !== 'ADMIN') {
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
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Users can only update their own profile unless admin
    if (req.user?.userId !== id && req.user?.role !== 'ADMIN') {
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
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

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
