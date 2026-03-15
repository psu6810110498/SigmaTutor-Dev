import { z } from 'zod';

// ── Chapter ──────────────────────────────────────────────────
export const createChapterSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    order: z.number().int().optional(),
});
export const updateChapterSchema = createChapterSchema.partial();
export const reorderChapterSchema = z.object({
    orders: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

// ── Lesson ───────────────────────────────────────────────────
export const createLessonSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['VIDEO', 'FILE', 'QUIZ']).default('VIDEO'),
    content: z.string().optional().nullable().or(z.literal('')),
    youtubeUrl: z.string().optional().nullable().or(z.literal('')),
    gumletVideoId: z.string().optional().nullable().or(z.literal('')),
    videoProvider: z.enum(['YOUTUBE', 'GUMLET']).default('YOUTUBE').optional(),
    duration: z.number().int().optional().nullable(), // Duration in minutes
    isFree: z.boolean().optional().default(false),
    materialUrl: z.string().optional().nullable().or(z.literal('')), // ✅ URL ไฟล์ PDF/เอกสาร
    order: z.number().int().optional(),
});
export const updateLessonSchema = createLessonSchema.partial();
export const reorderLessonSchema = z.object({
    orders: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

// ── Schedule (ปรับโฉมเป็นเนื้อหาบทเรียน) ───────────────────────────
export const createScheduleSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    chapterTitle: z.string().optional().nullable(), // ✅ ชื่อบทเรียน
    videoUrl: z.string().optional().nullable().or(z.literal("")), // ✅ ลิงก์วิดีโอ
    materialUrl: z.string().optional().nullable().or(z.literal("")), // ✅ ลิงก์ไฟล์
    sessionNumber: z.number().optional().nullable(),
    status: z.enum(['ON_SCHEDULE', 'POSTPONED', 'CANCELLED']).optional(),
    // คงฟิลด์เดิมไว้เป็น Optional เพื่อความปลอดภัย
    date: z.string().datetime().optional().nullable(),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
    location: z.string().optional().nullable(),
    zoomLink: z.string().optional().nullable(),
    gumletVideoId: z.string().optional().nullable(),
    videoProvider: z.enum(['YOUTUBE', 'GUMLET']).default('YOUTUBE').optional(),
    isOnline: z.boolean().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();