import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import bcrypt from 'bcryptjs';

const router: express.Router = express.Router();

/**
 * GET /api/users/instructors - ดึงรายชื่อคุณครูทั้งหมด (Admin เท่านั้น)
 */
router.get(
  '/instructors',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const instructors = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true, 
          title: true,    
          bio: true,      
          role: true,
          createdAt: true,
          profileImage: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: instructors });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch instructors';
      res.status(500).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/users/students - ดึงรายชื่อนักเรียนพร้อมเช็คสถานะ Online/Offline
 */
router.get(
  '/students',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const students = await prisma.user.findMany({
        where: { role: 'USER' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          enrollments: {
            select: {
              course: {
                select: {
                  title: true,
                  instructor: { select: { name: true } }
                }
              }
            }
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const formattedStudents = students.map(s => {
        // ตรรกะ Online: มีการเคลื่อนไหวภายใน 5 นาทีล่าสุด
        const diffMinutes = Math.floor((now.getTime() - new Date(s.updatedAt).getTime()) / 60000);
        const isOnline = diffMinutes <= 5;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          createdAt: s.createdAt,
          status: isOnline ? 'Online' : 'Offline',
          enrolledCourses: s.enrollments.map(e => ({
            title: e.course.title,
            instructorName: e.course.instructor.name
          })),
          totalSpent: s.payments.reduce((sum, p) => sum + p.amount, 0)
        };
      });

      res.json({ success: true, data: formattedStudents });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
  }
);

/**
 * POST /api/users/instructors - แอดมินสร้างบัญชีคุณครูใหม่
 */
router.post(
  '/instructors',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, nickname, title, bio, profileImage } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ success: false, error: 'อีเมลนี้มีในระบบแล้ว' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newTeacher = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          nickname,      
          title,         
          bio,           
          profileImage,  
        },
        select: { id: true, name: true, email: true, role: true }
      });

      res.status(201).json({ success: true, data: newTeacher });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create instructor';
      res.status(500).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/users - ดึงรายชื่อผู้ใช้ทั้งหมด (Admin เท่านั้น)
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
 * GET /api/users/:id - ดึงข้อมูลผู้ใช้รายบุคคล (พร้อมฟิลด์ Profile ครบถ้วน)
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
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * PATCH /api/users/:id - อัปเดตข้อมูลผู้ใช้ (รองรับข้อมูล Profile ใหม่ทั้งหมด)
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
        updatedAt: true
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * DELETE /api/users/:id - ลบผู้ใช้ (Admin เท่านั้น)
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
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;