// ============================================================
// Level Routes — CRUD for lookup table
// GET  /api/v1/levels        → List all (for dropdowns)
// POST /api/v1/levels        → Create (ADMIN)
// PUT  /api/v1/levels/:id    → Update (ADMIN)
// DEL  /api/v1/levels/:id    → Delete (ADMIN)
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ── Schema ────────────────────────────────────────────────

const levelSchema = z.object({
    name: z.string().min(1, 'ชื่อระดับชั้นห้ามว่าง'),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    order: z.number().int().min(0).default(0),
});

// ── GET all (public, ordered) ─────────────────────────────

router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const levels = await prisma.level.findMany({
            orderBy: { order: 'asc' },
            include: { _count: { select: { courses: true } } },
        });
        res.json({ success: true, data: levels });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch levels';
        res.status(500).json({ success: false, error: message });
    }
});

// ── POST (ADMIN) ──────────────────────────────────────────

router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(levelSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const level = await prisma.level.create({ data: req.body });
            res.status(201).json({ success: true, data: level });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create level';
            res.status(400).json({ success: false, error: message });
        }
    }
);

// ── PUT (ADMIN) ───────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(levelSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const level = await prisma.level.update({
                where: { id: String(req.params.id) },
                data: req.body,
            });
            res.json({ success: true, data: level });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Level not found';
            res.status(404).json({ success: false, error: message });
        }
    }
);

// ── DELETE (ADMIN) ────────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await prisma.level.delete({ where: { id: String(req.params.id) } });
            res.json({ success: true, message: 'Level deleted' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete level';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
