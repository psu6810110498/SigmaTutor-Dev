import { prisma } from '@sigma/db';

export class LessonService {
    async create(chapterId: string, data: {
        title: string;
        type?: 'VIDEO' | 'FILE' | 'QUIZ';
        content?: string | null;
        youtubeUrl?: string | null;
        gumletVideoId?: string | null;
        videoProvider?: 'YOUTUBE' | 'GUMLET';
        duration?: number;
        isFree?: boolean;
        materialUrl?: string | null;
        order?: number;
    }) {
        let order = data.order;
        if (order === undefined) {
            const last = await prisma.lesson.findFirst({
                where: { chapterId },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            order = (last?.order ?? -1) + 1;
        }

        return prisma.lesson.create({
            data: { ...data, chapterId, order },
        });
    }

    async update(id: string, data: {
        title?: string;
        type?: 'VIDEO' | 'FILE' | 'QUIZ';
        content?: string | null;
        youtubeUrl?: string | null;
        gumletVideoId?: string | null;
        videoProvider?: 'YOUTUBE' | 'GUMLET';
        duration?: number;
        isFree?: boolean;
        materialUrl?: string | null;
        order?: number;
    }) {
        return prisma.lesson.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.lesson.delete({
            where: { id },
        });
    }

    async reorder(updates: { id: string; order: number }[]) {
        const transaction = updates.map((u) =>
            prisma.lesson.update({
                where: { id: u.id },
                data: { order: u.order },
            })
        );
        return prisma.$transaction(transaction);
    }
}

export const lessonService = new LessonService();
