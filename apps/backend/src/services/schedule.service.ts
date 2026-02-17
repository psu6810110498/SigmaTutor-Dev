import { prisma } from '@sigma/db';

export class ScheduleService {
    async create(courseId: string, data: {
        date: Date | string;
        startTime: Date | string;
        endTime: Date | string;
        topic: string;
        location?: string | null;
        isOnline?: boolean;
    }) {
        return prisma.courseSchedule.create({
            data: { ...data, courseId },
        });
    }

    async update(id: string, data: {
        date?: Date | string;
        startTime?: Date | string;
        endTime?: Date | string;
        topic?: string;
        location?: string | null;
        isOnline?: boolean;
    }) {
        return prisma.courseSchedule.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.courseSchedule.delete({ where: { id } });
    }
}

export const scheduleService = new ScheduleService();
