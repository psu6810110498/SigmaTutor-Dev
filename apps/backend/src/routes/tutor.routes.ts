import { Router, Request, Response } from 'express';
import { prisma } from '@sigma/db';
import { validate } from '../middleware/validate.middleware.js';
import { tutorQuerySchema, TutorQueryInput } from '../schemas/course.schema.js';

const router: Router = Router();

/**
 * GET /api/tutors
 * Returns instructors who have at least one PUBLISHED course
 * matching all provided filter params (categoryId, levelId, courseType, price range, search).
 * Used by TutorHighlight to stay in sync with active QuickFilter + AdvancedFilter.
 */
router.get('/', validate(tutorQuerySchema, 'query'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoryId, levelId, courseType, minPrice, maxPrice, search } = req.query as unknown as TutorQueryInput;

        // Build the courses filter — instructors must have at least 1 match
        const courseWhere: Record<string, unknown> = {
            status: 'PUBLISHED',
            ...(categoryId && { categoryId }),
            ...(levelId && { levelId }),
            ...(courseType && { courseType }),
            ...(minPrice !== undefined && { price: { gte: minPrice } }),
            ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const tutors = await prisma.user.findMany({
            where: {
                role: 'INSTRUCTOR',
                instructorCourses: { some: courseWhere },
            },
            select: {
                id: true,
                name: true,
                nickname: true,
                profileImage: true,
                title: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: tutors });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch tutors';
        res.status(500).json({ success: false, error: message });
    }
});

export default router;
