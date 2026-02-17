import { prisma } from '@sigma/db';
import type {
    CreateCourseInput,
    UpdateCourseInput,
    UpdateCourseStatusInput,
    CourseQueryInput,
} from '../schemas/course.schema.js';

export class CourseService {
    /**
     * Create a new course
     */
    async create(instructorId: string, input: CreateCourseInput) {
        // Generate slug from title if not present (simple version)
        const slug = input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

        return prisma.course.create({
            data: {
                ...input,
                slug,
                instructorId,
            },
            include: { instructor: { select: { id: true, name: true, email: true } } },
        });
    }

    /**
     * Get a single course by ID
     */
    async findById(id: string) {
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                instructor: { select: { id: true, name: true, email: true } },
                chapters: {
                    include: {
                        lessons: { orderBy: { order: 'asc' } }
                    },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        return course;
    }

    /**
     * Query courses with filters, pagination, and sorting
     */
    async findMany(query: CourseQueryInput) {
        const { search, status, page, limit, sort, order } = query;

        const where = {
            ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    instructor: { select: { id: true, name: true } },
                    _count: { select: { enrollments: true } },
                },
                orderBy: { [sort]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.course.count({ where }),
        ]);

        return {
            courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Update a course
     */
    async update(id: string, input: UpdateCourseInput) {
        await this.findById(id); // throws if not found

        return prisma.course.update({
            where: { id },
            data: input,
            include: { instructor: { select: { id: true, name: true, email: true } } },
        });
    }

    /**
     * Update course status (DRAFT → PUBLISHED → ARCHIVED)
     */
    async updateStatus(id: string, input: UpdateCourseStatusInput) {
        await this.findById(id);

        return prisma.course.update({
            where: { id },
            data: { status: input.status },
        });
    }

    /**
     * Delete a course
     */
    async delete(id: string) {
        await this.findById(id);

        return prisma.course.delete({ where: { id } });
    }

    /**
     * Update thumbnail URL after upload
     */
    async updateThumbnail(id: string, thumbnailUrl: string) {
        return prisma.course.update({
            where: { id },
            data: { thumbnail: thumbnailUrl },
        });
    }
}

export const courseService = new CourseService();
