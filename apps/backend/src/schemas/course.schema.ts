import { z } from 'zod';

// --- Course ---

export const createCourseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
});

export const updateCourseSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    thumbnail: z.string().url().optional(),
});

export const updateCourseStatusSchema = z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export const courseQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    sort: z.enum(['price', 'createdAt', 'title']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

// --- Payment ---

export const createPaymentSchema = z.object({
    courseId: z.string().cuid('Invalid course ID'),
});

// --- Types ---

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
