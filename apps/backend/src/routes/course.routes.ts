import { Router, Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service.js';
import { upload, uploadService } from '../services/upload.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { publicApiLimiter } from '../middleware/rate-limit.middleware.js';
import { authenticate, optionalAuthenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseStatusSchema,
  marketplaceQuerySchema,
  MarketplaceQueryInput,
} from '../schemas/course.schema.js';
import { prisma } from '@sigma/db';

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
      // Debugging: log incoming payload (trimmed) to help trace missing schedules
      try { console.log('Create course payload:', JSON.stringify(req.body).slice(0, 1000)); } catch { };
      const course = await courseService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// "Master Key" Middleware for grabbing HttpOnly cookies automatically
const forceInjectToken = (req: any, res: Response, next: NextFunction) => {
  let token = '';
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)(accessToken|token)=([^;]+)/);
    if (match) token = match[2];
  }
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
    if (!req.cookies) req.cookies = {};
    req.cookies.accessToken = token;
    req.cookies.token = token;
  }
  next();
};

/**
 * POST /api/courses/upload/pdf
 * General file upload for course materials (PDF)
 */
router.post(
  '/upload/pdf',
  forceInjectToken,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  upload.single('file'), // รับไฟล์ที่ชื่อ field ว่า 'file' จากหน้าบ้าน
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      // Use UploadService to upload to R2
      const { url } = await import('../services/upload.service.js').then((m) =>
        m.uploadService.uploadFile(req.file!, 'courses/materials')
      );

      res.json({ success: true, url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/courses/marketplace
 * Public marketplace listing with advanced filters
 */
router.get(
  '/marketplace',
  publicApiLimiter,
  validate(marketplaceQuerySchema, 'query'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse through schema again to ensure proper type coercion (string → number etc.)
      const query = marketplaceQuerySchema.parse(req.query);
      const result = await courseService.getMarketplaceCourses(query);
      // Allow CDN/browser to cache for 60s, serve stale while revalidating for 5 min
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch courses';
      res.status(400).json({ success: false, error: message });
    }
  }
);

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
router.get(
  '/admin',
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const query = req.query as any;
      const result = await courseService.getAdminCourses(query);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch admin courses';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/courses/my-courses
 * Returns enrolled courses for the authenticated user.
 * Note: placed before /:id to avoid Express routing conflicts.
 */
router.get('/my-courses', authenticate, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const myCourses = await courseService.getMyCourses(userId);
    res.json({ success: true, data: myCourses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch my courses';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/courses/slug/:slug
 * Get course details by slug (public)
 */
router.get('/slug/:slug', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await courseService.findBySlug(String(req.params.slug), authReq.user?.userId);
    res.json({ success: true, data: course });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Course not found';
    res.status(404).json({ success: false, error: message });
  }
});

/**
 * GET /api/courses/:id
 * Get course details (public)
 */
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await courseService.findById(String(req.params.id), authReq.user?.userId);
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
/**
 * GET /api/courses/:id/students
 * Get all ACTIVE enrolled students for a course (ADMIN / INSTRUCTOR)
 */
router.get(
  '/:id/students',
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const students = await courseService.getCourseStudents(String(req.params.id));
      res.json({ success: true, data: students });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get students';
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

      const { url } = await import('../services/upload.service.js').then((m) =>
        m.uploadService.uploadFile(req.file!, 'courses/thumbnails')
      );

      const course = await courseService.updateThumbnail(String(req.params.id), url);
      res.json({ success: true, data: { thumbnailUrl: url, course } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// ── Admin Seat Management ─────────────────────────────────────

/**
 * POST /api/courses/:id/seats/sync
 * Force sync Redis seat counter from DB
 */
router.post(
  '/:id/seats/sync',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        select: { maxSeats: true, courseType: true }
      });

      if (course.courseType === 'ONLINE' || !course.maxSeats) {
        res.status(400).json({ success: false, error: 'Not a limited course' });
        return;
      }

      const enrolledCount = await prisma.enrollment.count({
        where: { courseId, status: 'ACTIVE' },
      });
      // Need to import seatReservationService at top to use it here: 
      const { seatReservationService } = await import('../services/seat-reservation.service.js');
      const reservedCount = await seatReservationService.countReservations(courseId);
      
      await seatReservationService.syncCounter(courseId, course.maxSeats, enrolledCount, reservedCount);
      
      res.json({ success: true, message: 'Seat counter synced successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync seats';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * PATCH /api/courses/:id/seats
 * Update maxSeats (ADMIN only)
 */
router.patch(
  '/:id/seats',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const maxSeats = Number(req.body.maxSeats);
      
      if (isNaN(maxSeats) || maxSeats < 0) {
        res.status(400).json({ success: false, error: 'Invalid maxSeats' });
        return;
      }

      await courseService.update(courseId, { maxSeats });
      res.json({ success: true, message: 'Seat limit updated and counter synced' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update seats';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/courses/:id/enrollments
 * Get enrolled students list for a limited course (ADMIN only)
 */
router.get(
  '/:id/enrollments',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: req.params.id, status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, email: true, profileImage: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: enrollments });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get enrollments';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * GET /api/courses/:id/availability
 * Get real-time seat availability for a course (public).
 */
router.get(
  '/:id/availability',
  publicApiLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const availability = await courseService.getAvailability(req.params.id);
      res.json({ success: true, data: availability });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch availability';
      const status = message === 'Course not found' ? 404 : 500;
      res.status(status).json({ success: false, error: message });
    }
  }
);

export default router;
