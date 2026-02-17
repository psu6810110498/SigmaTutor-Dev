import { Router, Response } from 'express';
import { lessonService } from '../services/lesson.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import {
    createLessonSchema,
    updateLessonSchema,
    reorderLessonSchema,
} from '../schemas/content.schema.js';
import { z } from 'zod';

const router: Router = Router();

// ── REORDER ───────────────────────────────────────────────

router.put(
    '/reorder',
    authenticate,
    requireRole('ADMIN'),
    validate(reorderLessonSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            await lessonService.reorder(req.body.orders);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reorder lessons',
            });
        }
    }
);

// ── CREATE ────────────────────────────────────────────────

const createSchemaWithChapterId = createLessonSchema.extend({
    chapterId: z.string().min(1, 'Chapter ID is required'),
});

router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(createSchemaWithChapterId),
    async (req: AuthRequest, res: Response) => {
        try {
            const { chapterId, ...data } = req.body;
            const lesson = await lessonService.create(chapterId, data);
            res.status(201).json({ success: true, data: lesson });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create lesson',
            });
        }
    }
);

// ── UPDATE ────────────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(updateLessonSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const lesson = await lessonService.update(String(req.params.id), req.body);
            res.json({ success: true, data: lesson });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update lesson',
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
            await lessonService.delete(String(req.params.id));
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete lesson',
            });
        }
    }
);

export default router;
