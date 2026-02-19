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
 * GET /api/courses/marketplace
 * Public marketplace listing with advanced filters
 */
router.get('/marketplace', async (req: Request, res: Response): Promise<void> => {
    try {
        // Allow unknown keys for new filters (categoryId, etc) which might not be in legacy schema
        // Or better: cast to any for now if schema is strict
        const query = req.query as any;
        const result = await courseService.getMarketplaceCourses(query);
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch courses';
        res.status(400).json({ success: false, error: message });
    }
});

/**
 * GET /api/courses/enrolled
 * Get user's enrolled courses (My Courses)
 */
router.get('/enrolled', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await courseService.getUserEnrolledCourses(req.user!.userId);
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch enrolled courses';
        res.status(400).json({ success: false, error: message });
    }
});

/**
 * GET /api/courses/admin
 * Admin/Instructor dashboard listing
 */
router.get('/admin', authenticate, requireRole('ADMIN', 'INSTRUCTOR'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = req.query as any;
        const result = await courseService.getAdminCourses(query);
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch admin courses';
        res.status(400).json({ success: false, error: message });
    }
});

/**
 * GET /api/courses
 * Query courses (public) - DEPRECATED: Use /marketplace
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = courseQuerySchema.parse(req.query);
        const result = await courseService.getMarketplaceCourses(query as any);
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch courses';
        res.status(400).json({ success: false, error: message });
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
