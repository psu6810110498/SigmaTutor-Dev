import { prisma } from '@sigma/db';

export class ScheduleService {
    async create(courseId: string, data: any) {
        return prisma.courseSchedule.create({
            data: { 
                ...data, 
                courseId,
                date: data.date || new Date(),
                startTime: data.startTime || new Date(),
                endTime: data.endTime || new Date(),
            },
        });
    }

    async update(id: string, data: any) {
        return prisma.courseSchedule.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.courseSchedule.delete({ where: { id } });
    }

    /**
     * ✅ ระบบ Transaction Sync: ล้างและบันทึกใหม่เพื่อให้ข้อมูลตรงกับหน้าจอ 100%
     */
    async sync(courseId: string, sessions: any[]) {
        return await prisma.$transaction(async (tx) => {
            // 1. ลบข้อมูลเดิมของคอร์สนี้นออกทั้งหมด
            await tx.courseSchedule.deleteMany({ where: { courseId } });

            // 2. บันทึกข้อมูลชุดใหม่เข้าไปตามลำดับ
            const results = [];
            for (const [index, s] of sessions.entries()) {
                results.push(await tx.courseSchedule.create({
                    data: {
                        courseId,
                        sessionNumber: s.sessionNumber || (index + 1),
                        topic: s.title || 'ไม่มีหัวข้อ',
                        chapterTitle: s.chapterTitle || null,
                        videoUrl: s.videoUrl || null,
                        materialUrl: s.materialUrl || null,
                        // ใส่ค่า Default เพื่อไม่ให้ชน Constraint ของ DB
                        date: new Date(),
                        startTime: new Date(),
                        endTime: new Date(),
                        status: 'ON_SCHEDULE'
                    }
                }));
            }
            return results;
        });
    }
}
export const scheduleService = new ScheduleService();