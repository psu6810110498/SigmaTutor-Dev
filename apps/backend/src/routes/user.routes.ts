import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import bcrypt from 'bcryptjs';

const router: express.Router = express.Router();

/**
 * GET /api/users/instructors - ดึงรายชื่อคุณครูพร้อมยอดสถิติและรายได้จริง
 */
router.get(
  '/instructors',
  authenticate as express.RequestHandler,
  requireRole('ADMIN', 'INSTRUCTOR') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const [instructors, totalUniqueStudents] = await Promise.all([
        prisma.user.findMany({
          where: { 
            OR: [{ role: 'INSTRUCTOR' }, { role: 'ADMIN' }]
          },
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true, 
            title: true,    
            bio: true,      
            role: true,
            profileImage: true,
            expertise: true,   
            education: true,   
            experience: true,  
            socialLink: true,  
            createdAt: true,
            courses: {
              select: {
                price: true, // ดึงราคาไว้ใช้สำรอง
                enrollments: { select: { userId: true, status: true } },
                payments: {
                  where: { status: 'COMPLETED' }, // 🌟 แก้กลับเป็น Enum ที่ปลอดภัย ป้องกันฐานข้อมูลล่ม
                  select: { amount: true }
                }
              }
            },
            _count: {          
              select: { courses: true }
            }
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { role: 'USER' } })
      ]);

      const formattedData = instructors.map(inst => {
        const allStudentIds = inst.courses.flatMap(c => c.enrollments.map(e => e.userId));
        const uniqueStudentsCount = new Set(allStudentIds).size;

        // 🌟 คำนวณรายได้ใหม่ ปลอดภัย 100%
        const totalEarnings = inst.courses.reduce((sum, course) => {
          let courseRevenue = course.payments.reduce((pSum, p) => pSum + Number(p.amount || 0), 0);

          // Fallback: หากระบบไม่บันทึก Payment ให้คูณจำนวนคนจากสถานะการลงทะเบียน(ACTIVE)แทน
          if (courseRevenue === 0 && course.price && course.enrollments.length > 0) {
            const activeEnrollments = course.enrollments.filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED').length;
            courseRevenue = Number(course.price) * activeEnrollments;
          }

          return sum + courseRevenue;
        }, 0);

        return {
          ...inst,
          totalEarnings,
          _count: {
            courses: inst._count.courses,
            enrollments: uniqueStudentsCount
          }
        };
      });

      res.json({ 
        success: true, 
        data: formattedData,
        totalUniqueStudents 
      });
    } catch (error) {
      console.error("Instructors API Error:", error);
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
          enrollments: {
            select: {
              status: true, // เพิ่มสถานะมาด้วย
              course: { select: { title: true, price: true, instructor: { select: { name: true } } } }
            }
          },
          payments: { 
            where: { status: 'COMPLETED' }, // 🌟 ป้องกันฐานข้อมูลล่มจากคำแปลกปลอม
            select: { amount: true } 
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const formattedStudents = students.map(s => {
        const diffMinutes = Math.floor((now.getTime() - new Date(s.updatedAt).getTime()) / 60000);
        
        let totalSpent = s.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        // Fallback คิดยอดซื้อจากคอร์สที่ลงผ่านแล้ว
        if (totalSpent === 0) {
          const activeEnrollments = s.enrollments.filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED');
          totalSpent = activeEnrollments.reduce((sum, e) => sum + Number(e.course?.price || 0), 0);
        }

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          createdAt: s.createdAt,
          status: diffMinutes <= 5 ? 'Online' : 'Offline',
          enrolledCourses: s.enrollments.map(e => ({
            title: e.course?.title || 'Unknown',
            instructorName: e.course?.instructor?.name || 'ไม่ระบุผู้สอน'
          })),
          totalSpent
        };
      });

      res.json({ success: true, data: formattedStudents });
    } catch (error) {
      console.error("Students API Error:", error);
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
        name, email, password, nickname, title, bio, 
        profileImage, expertise, education, experience, socialLink 
      } = req.body;

      const finalEmail = email || `teacher_${Date.now()}@sigma.com`;
      const existingUser = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (existingUser) {
        res.status(400).json({ success: false, error: 'อีเมลนี้มีในระบบแล้ว' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password || 'Sigma1234!', 12);
      const newTeacher = await prisma.user.create({
        data: {
          name, email: finalEmail, password: hashedPassword, role: 'INSTRUCTOR', 
          nickname, title, bio, profileImage, expertise, education, experience, socialLink
        },
        select: { id: true, name: true, email: true, role: true }
      });

      res.status(201).json({ success: true, data: newTeacher });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create instructor' });
    }
  }
);

/**
 * PATCH /api/users/:id - อัปเดตข้อมูลผู้ใช้
 */
router.patch('/:id', authenticate as express.RequestHandler, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const id = req.params.id as string;
  try {
    const { name, phone, birthday, educationLevel, school, province, address, profileImage, expertise, education, experience, socialLink } = req.body;
    if (authReq.user?.userId !== id && authReq.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    const user = await prisma.user.update({
      where: { id },
      data: { 
        name, phone, educationLevel, school, province, address, profileImage,
        expertise, education, experience, socialLink,
        birthday: birthday ? new Date(birthday) : undefined 
      },
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to update user' }); }
});

/**
 * DELETE /api/users/:id - ลบผู้ใช้
 */
router.delete(
  '/:id',
  authenticate as express.RequestHandler,
  requireRole('ADMIN') as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) { res.status(500).json({ success: false, error: 'Failed to delete user' }); }
  }
);

export default router;