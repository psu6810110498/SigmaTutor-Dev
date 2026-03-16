// ── /api/stats — Public platform stats สำหรับหน้าเกี่ยวกับเรา ──────────────────
import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { publicApiLimiter } from '../middleware/rate-limit.middleware.js';

const router: Router = Router();

/**
 * GET /api/stats/public
 * คืนตัวเลขสถิติจริงจากฐานข้อมูล: นักเรียน, คอร์ส, ครู
 * ใช้ Cache-Control เพื่อลด DB load (revalidate ทุก 5 นาที)
 */
router.get(
  '/public',
  publicApiLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // ดึงตัวเลขแบบ parallel เพื่อประสิทธิภาพ
      const [totalStudents, totalCourses, totalTeachers] = await Promise.all([
        prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        prisma.course.count({ where: { status: 'PUBLISHED' } }),
        prisma.teacher.count({
          where: { courses: { some: { status: 'PUBLISHED' } } },
        }),
      ]);

      // Cache 5 นาที เพื่อลด DB queries บ่อยๆ
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.json({
        success: true,
        data: { totalStudents, totalCourses, totalTeachers },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stats fetch failed';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
