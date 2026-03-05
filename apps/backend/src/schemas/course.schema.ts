import { z } from 'zod';

// --- Course ---

export const createCourseSchema = z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    originalPrice: z.number().min(0).optional().nullable(),
    promotionalPrice: z.number().min(0).optional().nullable(),
    courseType: z.enum(['ONLINE', 'ONLINE_LIVE', 'ONSITE']).default('ONLINE'),
    // Accept empty string as null to avoid validation errors from form submissions
    categoryId: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
    levelId: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
    instructorId: z.string().optional().nullable(),
    maxSeats: z.number().int().min(0).optional().nullable(),
    enrollStartDate: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
    enrollEndDate: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
    location: z.string().trim().optional().nullable(),
    mapUrl: z.string().url().optional().nullable(),
    zoomLink: z.string().url().optional().nullable(),
    // ✅ เพิ่มฟิลด์วิดีโอแนะนำและ PDF ให้สมบูรณ์
    demoVideoUrl: z.string().optional().nullable(),
    materialUrl: z.string().optional().nullable(), 
    published: z.boolean().default(false),
    videoCount: z.number().int().min(0).default(0),
    duration: z.string().trim().optional().nullable(),
    tags: z.array(z.string().trim()).optional().default([]),
    // Course schedules: each entry may include optional video and material URLs
    schedules: z.array(z.object({
        title: z.string().optional().nullable(),
        chapterTitle: z.string().optional().nullable(),
        sessionNumber: z.coerce.number().int().optional().nullable(),
        videoUrl: z.string().optional().nullable(),
        materialUrl: z.string().optional().nullable(),
    }).passthrough()).optional().default([]),
    isBestSeller: z.boolean().optional().default(false),
    isRecommended: z.boolean().optional().default(false),
});

// updateCourseSchema จะใช้ค่าจากด้านบนโดยอัตโนมัติ
export const updateCourseSchema = createCourseSchema.partial().extend({
    thumbnail: z.string().url().optional().nullable(),
    thumbnailSm: z.string().url().optional().nullable(),
});

export const updateCourseStatusSchema = z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export const courseQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    sort: z.enum(['price', 'createdAt', 'title', 'popular']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for GET /api/courses/marketplace
 */
export const marketplaceQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    categoryId: z.string().optional(),
    levelId: z.string().optional(),
    tutorId: z.string().optional(),
    courseType: z.enum(['ONLINE', 'ONLINE_LIVE', 'ONSITE']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'popular']).default('newest'),
});

/**
 * Schema for GET /api/tutors
 */
export const tutorQuerySchema = z.object({
    categoryId: z.string().optional(),
    levelId: z.string().optional(),
    courseType: z.enum(['ONLINE', 'ONLINE_LIVE', 'ONSITE']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    search: z.string().trim().max(100).optional(),
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
export type MarketplaceQueryInput = z.infer<typeof marketplaceQuerySchema>;
export type TutorQueryInput = z.infer<typeof tutorQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;