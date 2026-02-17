// ============================================================
// Review Routes — Course reviews by enrolled users
// POST   /api/v1/reviews              → Create review
// GET    /api/v1/reviews?courseId=xxx  → Get reviews (paginated)
// PATCH  /api/v1/reviews/:id/helpful  → Mark helpful (+1)
// DELETE /api/v1/reviews/:id          → Delete own review
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ── Schemas ───────────────────────────────────────────────

const createReviewSchema = z.object({
    courseId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
});

const reviewQuerySchema = z.object({
    courseId: z.string().cuid(),
    rating: z.coerce.number().int().min(1).max(5).optional(), // Filter by star
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    sort: z.enum(['createdAt', 'rating', 'helpful']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

// ── GET reviews (public) ──────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = reviewQuerySchema.parse(req.query);
        const { courseId, rating, page, limit, sort, order } = query;

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = { courseId };
        if (rating) where.rating = rating;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: { user: { select: { id: true, name: true } } },
                orderBy: { [sort]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        // Calculate average rating + distribution
        const stats = await prisma.review.aggregate({
            where: { courseId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const distribution = await prisma.review.groupBy({
            by: ['rating'],
            where: { courseId },
            _count: { rating: true },
            orderBy: { rating: 'desc' },
        });

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                reviews,
                stats: {
                    average: stats._avg.rating ?? 0,
                    total: stats._count.rating,
                    distribution: distribution.map((d) => ({
                        rating: d.rating,
                        count: d._count.rating,
                    })),
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch reviews';
        res.status(400).json({ success: false, error: message });
    }
});

// ── POST review (authenticated) ───────────────────────────

router.post(
    '/',
    authenticate,
    validate(createReviewSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { courseId, rating, comment } = req.body;
            const userId = req.user!.userId;

            // Check for duplicate review
            const existing = await prisma.review.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });

            if (existing) {
                res.status(409).json({ success: false, error: 'คุณรีวิวคอร์สนี้ไปแล้ว' });
                return;
            }

            const review = await prisma.review.create({
                data: { userId, courseId, rating, comment },
                include: { user: { select: { id: true, name: true } } },
            });

            res.status(201).json({ success: true, data: review });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create review';
            res.status(400).json({ success: false, error: message });
        }
    }
);

// ── PATCH helpful (+1) ────────────────────────────────────

router.patch(
    '/:id/helpful',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const review = await prisma.review.update({
                where: { id: String(req.params.id) },
                data: { helpful: { increment: 1 } },
            });
            res.json({ success: true, data: review });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Review not found';
            res.status(404).json({ success: false, error: message });
        }
    }
);

// ── DELETE own review ─────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const review = await prisma.review.findUnique({
                where: { id: String(req.params.id) },
            });

            if (!review) {
                res.status(404).json({ success: false, error: 'Review not found' });
                return;
            }

            // Only allow owner or ADMIN to delete
            if (review.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
                res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์ลบรีวิวนี้' });
                return;
            }

            await prisma.review.delete({ where: { id: String(req.params.id) } });
            res.json({ success: true, message: 'Review deleted' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete review';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
