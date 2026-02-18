import { Router, Request, Response } from 'express';
import { courseService } from '../services/course.service.js';
import { upload, getFileUrl } from '../services/upload.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import {
    createCourseSchema,
    updateCourseSchema,
    updateCourseStatusSchema,
    courseQuerySchema,
} from '../schemas/course.schema.js';
import { prisma } from '@sigma/db'; // ✅ เพิ่ม import prisma สำหรับใช้ดึงคอร์สของฉัน

const router: Router = Router();

/**
 * POST /api/courses
 * Create a new course (ADMIN only)
 */
router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(createCourseSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const course = await courseService.create(req.user!.userId, req.body);
            res.status(201).json({ success: true, data: course });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create course';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * GET /api/courses
 * Query courses (public)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = courseQuerySchema.parse(req.query);
        const result = await courseService.findMany(query);
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch courses';
        res.status(400).json({ success: false, error: message });
    }
});

/**
 * GET /api/courses/my-courses
 * ✅ ดึงข้อมูลคอร์สเรียนที่ผู้ใช้ล็อกอินลงทะเบียนไว้
 * ⚠️ วางไว้ตรงนี้ถูกต้องแล้ว (ก่อนถึง /:id) เพื่อไม่ให้ Express routing สับสน
 */
router.get('/my-courses', authenticate, async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
  
    try {
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { userId: userId },
            include: {
                course: {
                    include: {
                        instructor: { select: { name: true } },
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const myCourses = enrollments.map((en) => ({
            id: en.course.id,
            title: en.course.title,
            thumbnail: en.course.thumbnail,
            category: en.course.categoryId ? 'หมวดหมู่วิชา' : 'ทั่วไป', 
            instructor: en.course.instructor?.name || 'ไม่ระบุผู้สอน',
            courseType: en.course.courseType, 
            status: en.status,
            progress: en.status === 'COMPLETED' ? 100 : 0 
        }));

        res.json({ success: true, data: myCourses });
    } catch (error) {
        console.error('Fetch my-courses error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch my courses' });
    }
});

/**
 * GET /api/courses/:id
 * Get course details (public)
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await courseService.findById(String(req.params.id));
        res.json({ success: true, data: course });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Course not found';
        res.status(404).json({ success: false, error: message });
    }
});

/**
 * PUT /api/courses/:id
 * Update a course (ADMIN only)
 */
router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(updateCourseSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const course = await courseService.update(String(req.params.id), req.body);
            res.json({ success: true, data: course });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update course';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * PATCH /api/courses/:id/status
 * Update course status (ADMIN only)
 */
router.patch(
    '/:id/status',
    authenticate,
    requireRole('ADMIN'),
    validate(updateCourseStatusSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const course = await courseService.updateStatus(String(req.params.id), req.body);
            res.json({ success: true, data: course });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update status';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * DELETE /api/courses/:id
 * Delete a course (ADMIN only)
 */
router.delete(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await courseService.delete(String(req.params.id));
            res.json({ success: true, message: 'Course deleted successfully' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete course';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * POST /api/courses/:id/upload
 * Upload course thumbnail (ADMIN only)
 */
router.post(
    '/:id/upload',
    authenticate,
    requireRole('ADMIN'),
    upload.single('thumbnail'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: 'No file uploaded' });
                return;
            }

            // Use UploadService to upload to R2 (Correct Logic)
            const { url } = await import('../services/upload.service.js').then(m => m.uploadService.uploadFile(req.file!, 'courses/thumbnails'));

            const course = await courseService.updateThumbnail(String(req.params.id), url);
            res.json({ success: true, data: { thumbnailUrl: url, course } });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;