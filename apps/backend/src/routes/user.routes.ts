import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router: express.Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

/** Helper: parse JSON string array or return the array as-is */
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

/**
 * GET /api/users/instructors - ดึงรายชื่อคุณครูพร้อมยอดสถิติและรายได้จริง
 */
router.get(
  '/instructors',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const [instructors, totalUniqueStudents] = await Promise.all([
        prisma.teacher.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            title: true,
            bio: true,
            profileImage: true,
            expertise: true,
            education: true,
            experience: true,
            socialLink: true,
            createdAt: true,
            courses: {
              select: {
                id: true,
                title: true,
                price: true,
                enrollments: {
                  select: {
                    userId: true,
                    status: true,
                    createdAt: true,
                    user: { select: { name: true, profileImage: true } },
                  },
                },
                payments: {
                  where: { status: 'COMPLETED' },
                  select: { amount: true },
                },
              },
            },
            _count: { select: { courses: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { role: 'USER' } }),
      ]);

      const formattedData = instructors.map((inst) => {
        const allStudentIds = inst.courses.flatMap((c) => c.enrollments.map((e) => e.userId));
        const uniqueStudentsCount = new Set(allStudentIds).size;

        const totalEarnings = inst.courses.reduce((sum, course) => {
          let courseRevenue = course.payments.reduce((pSum, p) => pSum + Number(p.amount || 0), 0);
          if (courseRevenue === 0 && course.price && course.enrollments.length > 0) {
            const activeEnrollments = course.enrollments.filter(
              (e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
            ).length;
            courseRevenue = Number(course.price) * activeEnrollments;
          }
          return sum + courseRevenue;
        }, 0);

        return {
          ...inst,
          totalEarnings,
          _count: { courses: inst._count.courses, enrollments: uniqueStudentsCount },
        };
      });

      res.json({ success: true, data: formattedData, totalUniqueStudents });
    } catch (error) {
      console.error('Instructors API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch instructors' });
    }
  }
);

/**
 * GET /api/users/students - ดึงรายชื่อนักเรียน
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
          lastActive: true,
          profileImage: true,
          enrollments: {
            select: {
              status: true,
              course: { select: { title: true, price: true, teacher: { select: { name: true } } } },
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const formattedStudents = students.map((s) => {
        const activeTime = s.lastActive
          ? new Date(s.lastActive).getTime()
          : new Date(s.updatedAt).getTime();
        const diffMinutes = Math.floor((now.getTime() - activeTime) / 60000);

        let totalSpent = s.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        if (totalSpent === 0) {
          const activeEnrollments = s.enrollments.filter(
            (e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
          );
          totalSpent = activeEnrollments.reduce((sum, e) => sum + Number(e.course?.price || 0), 0);
        }
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          profileImage: s.profileImage,
          createdAt: s.createdAt,
          status: diffMinutes >= 0 && diffMinutes <= 5 ? 'Online' : 'Offline',
          enrolledCourses: s.enrollments.map((e) => ({
            title: e.course?.title || 'Unknown',
            instructorName: (e.course as any)?.teacher?.name || 'ไม่ระบุผู้สอน',
          })),
          totalSpent,
        };
      });
      res.json({ success: true, data: formattedStudents });
    } catch (error) {
      console.error('Fetch Students Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
  }
);

/**
 * POST /api/users/instructors - สร้างบัญชีคุณครู
 */
router.post(
  '/instructors',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name, email, nickname, title, bio, profileImage,
        expertise, education, experience, socialLink,
        quote, facebookUrl, instagramUrl, tiktokUrl, linkedinUrl,
      } = req.body;

      const educationHistory = parseJsonArray(req.body.educationHistory);
      const achievements = parseJsonArray(req.body.achievements);

      const finalEmail = email || `teacher_${Date.now()}@sigma.com`;
      const existingTeacher = await prisma.teacher.findUnique({ where: { email: finalEmail } });
      if (existingTeacher) {
        res.status(400).json({ success: false, error: 'อีเมลนี้มีในระบบแล้ว' });
        return;
      }

      const newTeacher = await prisma.teacher.create({
        data: {
          name, email: finalEmail, nickname, title, bio, profileImage,
          expertise, education, experience, socialLink,
          educationHistory, achievements, quote,
          facebookUrl, instagramUrl, tiktokUrl, linkedinUrl,
        },
        select: { id: true, name: true, email: true },
      });
      res.status(201).json({ success: true, data: newTeacher });
    } catch (error) {
      console.error('Create instructor error:', error);
      res.status(500).json({ success: false, error: 'Failed to create instructor' });
    }
  }
);

/**
 * PATCH /api/users/:id - อัปเดตข้อมูลผู้ใช้
 * - รองรับ FormData (ผ่าน Multer)
 * - ถ้าเป็นครู จะอัปเดต Teacher record ด้วย (แก้ bug เดิมที่ไม่ได้บันทึก teacher fields)
 */
router.patch(
  '/:id',
  authenticate as express.RequestHandler,
  upload.single('profileImage') as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;

    try {
      if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const {
        name, phone, birthday, educationLevel, school, province, address,
        expertise, education, experience, socialLink, nickname, title, bio,
        quote, facebookUrl, instagramUrl, tiktokUrl, linkedinUrl,
      } = req.body;

      const educationHistory = parseJsonArray(req.body.educationHistory);
      const achievements = parseJsonArray(req.body.achievements);

      let profileImageUrl = req.body.profileImage as string | undefined;
      if (req.file) {
        profileImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      // 1. Try to update User record if it exists
      let user = null;
      try {
        user = await prisma.user.update({
          where: { id },
          data: {
            name, phone, educationLevel, school, province, address,
            profileImage: profileImageUrl,
            birthday: birthday ? new Date(birthday) : undefined,
          },
          select: { id: true, email: true, name: true, role: true, profileImage: true, updatedAt: true },
        });
      } catch (err: any) {
        if (err.code !== 'P2025') throw err; // Throw if not "Record not found"
      }

      // 2. Sync or Update Teacher record
      // Search by email if User was found, otherwise search by the provided id (in case it is a Teacher id)
      const teacher = user 
        ? await prisma.teacher.findUnique({ where: { email: user.email } })
        : await prisma.teacher.findUnique({ where: { id } });

      if (teacher) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            name, nickname, title, bio, expertise, education, experience,
            socialLink, profileImage: profileImageUrl, educationHistory,
            achievements, quote, facebookUrl, instagramUrl, tiktokUrl, linkedinUrl,
          },
        });
      }

      if (!user && !teacher) {
        res.status(404).json({ success: false, error: 'User or Teacher not found' });
        return;
      }

      res.json({ success: true, data: user || teacher });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      });
    }
  }
);

/**
 * DELETE /api/users/:id - ลบผู้ใช้
 */
router.delete(
  '/:id',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = await prisma.user.findUnique({ where: { id } });
      const teacher = await prisma.teacher.findUnique({ where: { id } });

      const targetEmail = user?.email || teacher?.email;

      if (!targetEmail) {
        res.status(404).json({ success: false, error: 'User or Teacher not found' });
        return;
      }

      // Use deleteMany to avoid P2025 errors if the record exists in only one table
      await prisma.teacher.deleteMany({ where: { email: targetEmail } });
      await prisma.user.deleteMany({ where: { email: targetEmail } });

      res.json({ success: true, message: 'User/Teacher deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      });
    }
  }
);

/**
 * GET /api/users/:id - ดึงข้อมูลผู้ใช้รายบุคคล
 */
router.get(
  '/:id',
  authenticate as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      const { password, ...userData } = user;
      res.json({ success: true, data: userData });
    } catch (error) {
      console.error('Fetch User by ID Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user data' });
    }
  }
);

export default router;
