import { z } from 'zod';

// ── Chapter ──────────────────────────────────────────────────

export const createChapterSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    order: z.number().int().optional(),
});

export const updateChapterSchema = createChapterSchema.partial();

export const reorderChapterSchema = z.object({
    orders: z.array(
        z.object({
            id: z.string(),
            order: z.number().int(),
        })
    ),
});

// ── Lesson ───────────────────────────────────────────────────

export const createLessonSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['VIDEO', 'FILE', 'QUIZ']).default('VIDEO'),
    content: z.string().optional().nullable(),
    youtubeUrl: z.string().optional().nullable(),
    duration: z.number().int().optional(),
    order: z.number().int().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonSchema = z.object({
    orders: z.array(
        z.object({
            id: z.string(),
            order: z.number().int(),
        })
    ),
});

// ── Schedule ─────────────────────────────────────────────────

export const createScheduleSchema = z.object({
    date: z.string().datetime(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    topic: z.string().min(1, 'Topic is required'),
    location: z.string().optional().nullable(),
    isOnline: z.boolean().optional().default(false),
});

export const updateScheduleSchema = createScheduleSchema.partial();
