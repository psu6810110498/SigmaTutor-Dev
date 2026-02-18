import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

const router: express.Router = express.Router();

/**
 * GET /api/users - Get all users (admin only)
 */
router.get(
  '/',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
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
      res.json({ success: true, data: users });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      res.status(500).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/users/:id - Get user by ID
 */
router.get('/:id', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const id = req.params.id as string;

  try {
    if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        phone: true,
        address: true,
        school: true,
        educationLevel: true,
        province: true,
        birthday: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/users/:id - Update user
 * ✅ เวอร์ชันสมบูรณ์: บันทึกและดึงข้อมูลกลับมาครบทุกฟิลด์
 */
router.patch('/:id', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const id = req.params.id as string;

  try {
    const { name, phone, birthday, educationLevel, school, province, address, profileImage } = req.body;

    if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { 
        name,
        phone,
        educationLevel,
        school,
        province,
        address,
        profileImage,
        birthday: birthday ? new Date(birthday) : undefined,
      },
      select: { // ✅ คืนค่ากลับไปให้ครบเพื่อให้ Frontend อัปเดตทันที
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        phone: true,
        address: true,
        school: true,
        educationLevel: true,
        province: true,
        birthday: true
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id - Delete user (admin only)
 */
router.delete(
  '/:id',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    try {
      await prisma.user.delete({ where: { id } });
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  }
);

export default router;