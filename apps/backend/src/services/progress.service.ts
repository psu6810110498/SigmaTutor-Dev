import { prisma } from '@sigma/db';

export class ProgressService {
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
}

export const progressService = new ProgressService();
