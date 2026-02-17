import { Router, Response } from 'express';
import { chapterService } from '../services/chapter.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import {
    createChapterSchema,
    updateChapterSchema,
    reorderChapterSchema,
} from '../schemas/content.schema.js';
import { z } from 'zod';

const router: Router = Router();

// ── REORDER (Must be before :id) ──────────────────────────

router.put(
    '/reorder',
    authenticate,
    requireRole('ADMIN'),
    validate(reorderChapterSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            await chapterService.reorder(req.body.orders);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reorder',
            });
        }
    }
);

// ── CREATE ────────────────────────────────────────────────

const createSchemaWithCourseId = createChapterSchema.extend({
    courseId: z.string().min(1, 'Course ID is required'),
});

router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(createSchemaWithCourseId),
    async (req: AuthRequest, res: Response) => {
        try {
            const { courseId, ...data } = req.body;
            const chapter = await chapterService.create(courseId, data);
            res.status(201).json({ success: true, data: chapter });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create chapter',
            });
        }
    }
);

// ── UPDATE ────────────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(updateChapterSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const chapter = await chapterService.update(String(req.params.id), req.body);
            res.json({ success: true, data: chapter });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update chapter',
            });
        }
    }
);

// ── DELETE ────────────────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response) => {
        try {
            await chapterService.delete(String(req.params.id));
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete chapter',
            });
        }
    }
);

export default router;
