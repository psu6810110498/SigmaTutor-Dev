import { Router, Response } from 'express';
import { scheduleService } from '../services/schedule.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import {
    createScheduleSchema,
    updateScheduleSchema,
} from '../schemas/content.schema.js';
import { z } from 'zod';

const router: Router = Router();

// ── CREATE ────────────────────────────────────────────────

const createSchemaWithCourseId = createScheduleSchema.extend({
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
            const schedule = await scheduleService.create(courseId, data);
            res.status(201).json({ success: true, data: schedule });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create schedule',
            });
        }
    }
);

// ── UPDATE ────────────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(updateScheduleSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const schedule = await scheduleService.update(String(req.params.id), req.body);
            res.json({ success: true, data: schedule });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update schedule',
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
            await scheduleService.delete(String(req.params.id));
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete schedule',
            });
        }
    }
);

export default router;
