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
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. ลบข้อมูลเดิมของคอร์สนี้นออกทั้งหมด
                await tx.courseSchedule.deleteMany({ where: { courseId } });

                // ถ้าไม่มีข้อมูลส่งมาเลย (เช่น ลบเนื้อหาออกหมด) ให้อัปเดต videoCount เป็น 0 แล้วหยุด
                if (!sessions || sessions.length === 0) {
                    await tx.course.update({ where: { id: courseId }, data: { videoCount: 0 } });
                    return [];
                }

                // 2. บันทึกข้อมูลชุดใหม่เข้าไปตามลำดับ
                const results = [];
                for (const [index, s] of sessions.entries()) {
                    results.push(await tx.courseSchedule.create({
                        data: {
                            courseId,
                            // ✅ บังคับแปลงเป็นตัวเลข (Number) เสมอ ป้องกัน Error Type Mismatch
                            sessionNumber: Number(s.sessionNumber) || (index + 1),
                            topic: s.title || 'ไม่มีหัวข้อ',
                            chapterTitle: s.chapterTitle || null,
                            videoUrl: s.videoUrl || null,
                            materialUrl: s.materialUrl || null,
                            gumletVideoId: s.gumletVideoId || null,
                            videoProvider: s.videoProvider || 'YOUTUBE',
                            // ✅ ใส่ค่า Date พื้นฐาน (ลบ Status ออก เผื่อ Database ไม่มีฟิลด์นี้)
                            date: new Date(),
                            startTime: new Date(),
                            endTime: new Date()
                        }
                    }));
                }
                // ✅ หลัง sync เสร็จ: นับจำนวน session ที่มี videoUrl หรือ gumletVideoId แล้วอัปเดต course.videoCount อัตโนมัติ
                const videoCount = results.filter(r =>
                    (r.videoUrl && r.videoUrl.trim() !== '') ||
                    (r.gumletVideoId && r.gumletVideoId.trim() !== '')
                ).length;
                await tx.course.update({
                    where: { id: courseId },
                    data: { videoCount },
                });

                return results;
            });
        } catch (error) {
            // ✅ ดักจับ Error ตรงนี้ จะได้รู้ว่าฐานข้อมูลด่าว่าอะไร
            console.error("🔥 Prisma Sync Error:", error);
            throw error;
        }
    }
}

export const scheduleService = new ScheduleService();