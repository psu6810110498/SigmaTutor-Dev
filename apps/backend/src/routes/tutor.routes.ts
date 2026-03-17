import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { publicApiLimiter } from '../middleware/rate-limit.middleware.js';
import { tutorQuerySchema, TutorQueryInput } from '../schemas/course.schema.js';
import { tutorService } from '../services/tutor.service.js';

const router: Router = Router();

/**
 * GET /api/tutors
 * Returns instructors who have at least one PUBLISHED course
 * matching all provided filter params (categoryId, levelId, courseType, price range, search).
 * Used by TutorHighlight to stay in sync with active QuickFilter + AdvancedFilter.
 */
router.get(
    '/',
    publicApiLimiter,
    validate(tutorQuerySchema, 'query'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const query = req.query as unknown as TutorQueryInput;
            const tutors = await tutorService.getFiltered(query);
            // Allow CDN/browser to cache for 30s, serve stale while revalidating for 2 min
            res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
            res.json({ success: true, data: tutors });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch tutors';
            res.status(500).json({ success: false, error: message });
        }
    }
);

/**
 * GET /api/tutors/all
 * Returns all instructors with extended fields for the main Tutors public grid.
 * Optimized with cache headers.
 */
router.get(
    '/all',
    publicApiLimiter,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const tutors = await tutorService.getAll();
            // Allow CDN/browser to cache for 60s, serve stale while revalidating for 300s
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.json({ success: true, data: tutors });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch all tutors';
            res.status(500).json({ success: false, error: message });
        }
    }
);

/**
 * GET /api/tutors/:id
 * Returns a specific instructor's full profile including their published courses.
 * Optimized with cache headers.
 */
router.get(
    '/:id',
    publicApiLimiter,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const tutor = await tutorService.getById(id);
            if (!tutor) {
                res.status(404).json({ success: false, error: 'Tutor not found' });
                return;
            }
            // Allow CDN/browser to cache for 60s, serve stale while revalidating for 300s
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
            res.json({ success: true, data: tutor });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch tutor details';
            res.status(500).json({ success: false, error: message });
        }
    }
);

export default router;
