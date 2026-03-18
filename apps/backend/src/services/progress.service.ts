import { prisma } from '@sigma/db';

export class ProgressService {
    async checkEnrollmentAccess(userId: string, courseId: string, userRole?: string) {
        if (userRole === 'ADMIN') return { allowed: true };

        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!enrollment || enrollment.status !== 'ACTIVE') {
            return { allowed: false, reason: 'NOT_ENROLLED' };
        }

        if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
            return { allowed: false, reason: 'COURSE_EXPIRED', expiresAt: enrollment.expiresAt };
        }

        return { allowed: true, enrollment };
    }

    async getProgressByCourse(userId: string, courseId: string) {
        return prisma.userProgress.findMany({
            where: {
                userId,
                courseId,
            },
        });
    }

    async toggleProgress(userId: string, courseId: string, data: { lessonId?: string; scheduleId?: string }) {
        if (!data.lessonId && !data.scheduleId) {
            throw new Error('Must provide either lessonId or scheduleId');
        }

        // Check if progress already exists
        const existingProgress = await prisma.userProgress.findFirst({
            where: {
                userId,
                courseId,
                ...(data.lessonId ? { lessonId: data.lessonId } : {}),
                ...(data.scheduleId ? { scheduleId: data.scheduleId } : {}),
            },
        });

        if (existingProgress) {
            // Toggle the completion status
            return prisma.userProgress.update({
                where: { id: existingProgress.id },
                data: { isCompleted: !existingProgress.isCompleted },
            });
        } else {
            // Create new progress record
            const targetId = data.lessonId || data.scheduleId;
            return prisma.userProgress.create({
                data: {
                    userId,
                    courseId,
                    ...(data.lessonId ? { lessonId: data.lessonId } : {}),
                    ...(data.scheduleId ? { scheduleId: data.scheduleId } : {}),
                    isCompleted: true,
                },
            });
        }
    }

    async updateWatchTime(
        userId: string,
        courseId: string,
        data: { lessonId?: string; scheduleId?: string; watchedSeconds: number }
    ) {
        if (!data.lessonId && !data.scheduleId) {
            throw new Error('Must provide either lessonId or scheduleId');
        }

        const where = data.lessonId
            ? { userId_lessonId: { userId, lessonId: data.lessonId } }
            : { userId_scheduleId: { userId, scheduleId: data.scheduleId! } };

        return prisma.userProgress.upsert({
            where,
            update: {
                watchedSeconds: data.watchedSeconds,
                lastWatchedAt: new Date()
            },
            create: {
                userId,
                courseId,
                ...(data.lessonId ? { lessonId: data.lessonId } : {}),
                ...(data.scheduleId ? { scheduleId: data.scheduleId } : {}),
                watchedSeconds: data.watchedSeconds,
                lastWatchedAt: new Date(),
                isCompleted: false,
            },
        });
    }
}

export const progressService = new ProgressService();
