// ============================================================
// Category Routes — CRUD for lookup table
// GET  /api/v1/categories        → List all (for dropdowns)
// POST /api/v1/categories        → Create (ADMIN)
// PUT  /api/v1/categories/:id    → Update (ADMIN)
// DEL  /api/v1/categories/:id    → Delete (ADMIN)
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ── Schema ────────────────────────────────────────────────

const categorySchema = z.object({
    name: z.string().min(1, 'ชื่อหมวดหมู่ห้ามว่าง'),
    slug: z.string().min(1, 'Slug ห้ามว่าง').regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็น a-z, 0-9, หรือ -'),
});

// ── GET all (public) ──────────────────────────────────────

router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { courses: true } },
                children: { select: { id: true, name: true, slug: true } },
            },
        });
        // Add parentId to response (it's a scalar field, included by default)
        res.json({ success: true, data: categories });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch categories';
        res.status(500).json({ success: false, error: message });
    }
});

// ── POST (ADMIN) ──────────────────────────────────────────

router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(categorySchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const category = await prisma.category.create({ data: req.body });
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create category';
            res.status(400).json({ success: false, error: message });
        }
    }
);

// ── PUT (ADMIN) ───────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(categorySchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const category = await prisma.category.update({
                where: { id: String(req.params.id) },
                data: req.body,
            });
            res.json({ success: true, data: category });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Category not found';
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
            await prisma.category.delete({ where: { id: String(req.params.id) } });
            res.json({ success: true, message: 'Category deleted' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete category';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
