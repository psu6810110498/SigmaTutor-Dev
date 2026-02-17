import { prisma } from '@sigma/db';

export class ChapterService {
    async create(courseId: string, data: { title: string; order?: number }) {
        // Get max order if not provided
        let order = data.order;
        if (order === undefined) {
            const last = await prisma.chapter.findFirst({
                where: { courseId },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            order = (last?.order ?? -1) + 1;
        }

        return prisma.chapter.create({
            data: { ...data, courseId, order },
        });
    }

    async update(id: string, data: { title?: string; order?: number }) {
        return prisma.chapter.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.chapter.delete({
            where: { id },
        });
    }

    async reorder(updates: { id: string; order: number }[]) {
        const transaction = updates.map((u) =>
            prisma.chapter.update({
                where: { id: u.id },
                data: { order: u.order },
            })
        );
        return prisma.$transaction(transaction);
    }
}

export const chapterService = new ChapterService();
