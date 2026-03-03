import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ── Schema ────────────────────────────────────────────────

const couponSchema = z.object({
    code: z.string().min(1, 'รหัสคูปองห้ามว่าง').toUpperCase(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive('ส่วนลดต้องมากกว่า 0'),
    maxDiscount: z.number().nullable().optional(),
    minPurchase: z.number().nullable().optional(),
    startDate: z.string().datetime().optional(), // ISO string
    endDate: z.string().datetime().nullable().optional(),
    usageLimit: z.number().nullable().optional(),
    isOneTimeUse: z.boolean().optional(),
    isActive: z.boolean().optional(),
    applicableCourseIds: z.array(z.string()).optional(),
});

const validateSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสคูปอง').toUpperCase(),
    courseIds: z.array(z.string()).min(1, 'ตะกร้าสินค้าว่างเปล่า'),
});

// ── GET all (ADMIN) ───────────────────────────────────────

router.get(
    '/',
    authenticate,
    requireRole('ADMIN'),
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const coupons = await prisma.coupon.findMany({
                where: { deletedAt: null }, // Hide soft-deleted
                orderBy: { createdAt: 'desc' },
                include: {
                    applicableCourses: { select: { id: true, title: true } },
                },
            });
            res.json({ success: true, data: coupons });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch coupons';
            res.status(500).json({ success: false, error: message });
        }
    }
);

// ── POST /validate (PUBLIC) ───────────────────────────────

router.post(
    '/validate',
    authenticate, // User must be logged in to apply coupon
    validate(validateSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { code, courseIds } = req.body;

            if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
                res.status(400).json({ success: false, error: 'ตะกร้าสินค้าว่างเปล่า' });
                return;
            }

            // Fetch course prices to calculate real totals
            const courses = await prisma.course.findMany({
                where: { id: { in: courseIds } },
                select: { id: true, price: true }
            });

            if (courses.length !== courseIds.length) {
                res.status(400).json({ success: false, error: 'ข้อมูลคอร์สบางรายการไม่ถูกต้อง' });
                return;
            }

            const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

            // 1. Find the active coupon
            const coupon = await prisma.coupon.findFirst({
                where: {
                    code,
                    isActive: true,
                    deletedAt: null,
                    startDate: { lte: new Date() },
                },
                include: {
                    applicableCourses: { select: { id: true } }
                }
            });

            if (!coupon) {
                res.status(404).json({ success: false, error: 'รหัสส่วนลดนี้ไม่ถูกต้อง หรือยังไม่เปิดใช้งาน' });
                return;
            }

            // 2. Check Expiration Date
            if (coupon.endDate && new Date() > coupon.endDate) {
                res.status(400).json({ success: false, error: 'รหัสส่วนลดนี้หมดอายุแล้ว' });
                return;
            }

            // 3. Check Usage Limit
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                res.status(400).json({ success: false, error: 'รหัสส่วนลดนี้ถูกใช้งานครบตามสิทธิ์แล้ว' });
                return;
            }

            // 4. Check Minimum Purchase
            if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
                res.status(400).json({ success: false, error: `รหัสส่วนลดนี้ต้องซื้อขั้นต่ำ ฿${coupon.minPurchase}` });
                return;
            }

            // 4.5 Check One-Time Use Limit
            if (coupon.isOneTimeUse && req.user?.userId) {
                const pastUsage = await prisma.payment.findFirst({
                    where: {
                        userId: req.user.userId,
                        couponId: coupon.id,
                        status: 'COMPLETED'
                    }
                });
                if (pastUsage) {
                    res.status(400).json({ success: false, error: 'คุณเคยใช้งานรหัสส่วนลดนี้ไปแล้ว' });
                    return;
                }
            }

            // 5. Determine Eligible Courses
            let eligibleTotalAmount = totalAmount;

            if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
                const applicableIds = coupon.applicableCourses.map(c => c.id);
                const eligibleCourses = courses.filter(c => applicableIds.includes(c.id));

                if (eligibleCourses.length === 0) {
                    res.status(400).json({ success: false, error: 'รหัสส่วนลดนี้ไม่สามารถใช้กับคอร์สในตะกร้าได้' });
                    return;
                }

                eligibleTotalAmount = eligibleCourses.reduce((sum, c) => sum + c.price, 0);
            }

            // 6. Calculate Discount using Eligible Total
            let discountAmount = 0;
            if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = (eligibleTotalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            // Prevent negative total
            if (discountAmount > eligibleTotalAmount) {
                discountAmount = eligibleTotalAmount;
            }

            res.json({
                success: true,
                data: {
                    couponId: coupon.id,
                    code: coupon.code,
                    originalTotal: totalAmount,
                    discountAmount: discountAmount,
                    finalTotal: Math.max(0, totalAmount - discountAmount),
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Validation failed';
            res.status(500).json({ success: false, error: message });
        }
    }
);

// ── POST (ADMIN) ──────────────────────────────────────────

router.post(
    '/',
    authenticate,
    requireRole('ADMIN'),
    validate(couponSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            // Check for duplicate code
            const existing = await prisma.coupon.findUnique({ where: { code: req.body.code } });
            if (existing) {
                res.status(400).json({ success: false, error: 'รหัสคูปองนี้มีในระบบแล้ว' });
                return;
            }

            // Separate the relation array from scalar fields
            const { applicableCourseIds, ...restPayload } = req.body;
            const payload = { ...restPayload };

            if (payload.startDate) payload.startDate = new Date(payload.startDate);
            if (payload.endDate) payload.endDate = new Date(payload.endDate);

            const coupon = await prisma.coupon.create({
                data: {
                    ...payload,
                    applicableCourses: applicableCourseIds && applicableCourseIds.length > 0
                        ? { connect: applicableCourseIds.map((id: string) => ({ id })) }
                        : undefined
                }
            });
            res.status(201).json({ success: true, data: coupon });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create coupon';
            res.status(400).json({ success: false, error: message });
        }
    }
);

// ── RECYCLE BIN (ADMIN) ───────────────────────────────────

router.get(
    '/trash',
    authenticate,
    requireRole('ADMIN'),
    async (_req: Request, res: Response): Promise<void> => {
        try {
            const coupons = await prisma.coupon.findMany({
                where: { deletedAt: { not: null } },
                orderBy: { deletedAt: 'desc' },
                include: {
                    applicableCourses: { select: { id: true, title: true } },
                },
            });
            res.json({ success: true, data: coupons });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch trashed coupons';
            res.status(500).json({ success: false, error: message });
        }
    }
);

router.put(
    '/:id/restore',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const coupon = await prisma.coupon.update({
                where: { id: String(req.params.id) },
                data: { deletedAt: null },
            });
            res.json({ success: true, data: coupon, message: 'Coupon restored' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore coupon';
            res.status(400).json({ success: false, error: message });
        }
    }
);

router.delete(
    '/:id/force',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await prisma.coupon.delete({
                where: { id: String(req.params.id) },
            });
            res.json({ success: true, message: 'Coupon permanently deleted' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to permanently delete coupon';
            res.status(400).json({ success: false, error: message });
        }
    }
);

// ── PUT (ADMIN) ───────────────────────────────────────────

router.put(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    validate(couponSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { applicableCourseIds, ...restPayload } = req.body;
            const payload = { ...restPayload };
            if (payload.startDate) payload.startDate = new Date(payload.startDate);
            if (payload.endDate) payload.endDate = new Date(payload.endDate);

            const coupon = await prisma.coupon.update({
                where: { id: String(req.params.id) },
                data: {
                    ...payload,
                    applicableCourses: applicableCourseIds !== undefined
                        ? { set: applicableCourseIds.map((id: string) => ({ id })) }
                        : undefined
                },
            });
            res.json({ success: true, data: coupon });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Coupon not found';
            res.status(404).json({ success: false, error: message });
        }
    }
);

// ── DELETE soft delete (ADMIN) ────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            // Soft Delete
            await prisma.coupon.update({
                where: { id: String(req.params.id) },
                data: { deletedAt: new Date() },
            });
            res.json({ success: true, message: 'Coupon deleted (soft delete)' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete coupon';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
