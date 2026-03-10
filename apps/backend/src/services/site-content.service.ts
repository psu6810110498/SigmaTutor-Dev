import { prisma } from '@sigma/db';

// Default values used when a key has never been saved
const DEFAULTS: Record<string, unknown> = {
    students: [
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์', color: 'from-blue-400 to-indigo-600', image: null },
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์', color: 'from-purple-400 to-blue-600', image: null },
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์', color: 'from-cyan-400 to-blue-500', image: null },
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์', color: 'from-indigo-400 to-purple-600', image: null },
    ],
    stats: [
        { value: '10,000+', label: 'นักเรียนที่ไว้วางใจ' },
        { value: '40+', label: 'คอร์สเรียนคุณภาพ' },
        { value: '98%', label: 'สอบคณะที่หวัง' },
    ],
    universities: [
        { name: 'จุฬาฯ', abbr: 'จฬ', bg: 'bg-pink-100', text: 'text-pink-600', image: null },
        { name: 'มหิดล', abbr: 'มห', bg: 'bg-blue-100', text: 'text-blue-600', image: null },
        { name: 'ธรรมศาสตร์', abbr: 'ธศ', bg: 'bg-red-100', text: 'text-red-600', image: null },
        { name: 'เกษตรฯ', abbr: 'กษ', bg: 'bg-green-100', text: 'text-green-600', image: null },
        { name: 'ลาดกระบัง', abbr: 'ลก', bg: 'bg-orange-100', text: 'text-orange-600', image: null },
        { name: 'มจธ.', abbr: 'มจ', bg: 'bg-purple-100', text: 'text-purple-600', image: null },
    ],
    tutors: [
        {
            name: 'พี่บอส (สรวิธ วิฒนรงค์)',
            subject: 'วิชา: คอมพิวเตอร์',
            desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์โอลิมปิกและสอบเข้ามหาวิทยาลัย',
            initial: 'บ',
            color: 'from-blue-500 to-indigo-600',
            image: null,
        },
        {
            name: 'พี่พีช (พารีย์ ยาเก)',
            subject: 'วิชา: คอมพิวเตอร์',
            desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์ระดับชาติและนานาชาติ',
            initial: 'พ',
            color: 'from-purple-500 to-blue-600',
            image: null,
        },
    ],
    testimonial: {
        quote: 'จากที่เกลียดฟิสิกส์ กลายเป็นวิชาทำคะแนน! เทคนิคของพี่บอสช่วยให้มองงานยากกว่าออก ไม่ต้องท่องสูตร สอบติด วิศวกรรมคอมพิวเตอร์ ม.ดัง มาแล้ว ขอบคุณมากๆ',
        name: 'น้องพลอย',
        faculty: 'วิศวกรรมศาสตร์ สาขาคอมพิวเตอร์',
        image: null,
    },
    faqs: [
        { q: 'เรียนผ่าน iPad หรือมือถือได้ไหม?', a: 'ได้เลย! ระบบรองรับทุกอุปกรณ์ ทั้ง iPad, มือถือ, แท็บเล็ต และคอมพิวเตอร์ ไม่ต้องติดตั้งแอปเพิ่มเติม' },
        { q: 'สมัครเรียนได้เลยไหม?', a: 'สมัครได้เลยทันที หลังสมัครสามารถเข้าเรียนได้ภายใน 24 ชั่วโมง ไม่มีค่าสมัครเพิ่มเติม' },
        { q: 'มีคอร์สเรียนสดด้วย เรียนที่ไหนบ้างได้บ้าง?', a: 'มีทั้งคอร์สออนไลน์และ Live สด สามารถเรียนได้จากทุกที่ผ่านระบบออนไลน์ของเรา' },
    ],
};

export const siteContentService = {
    async getAll() {
        const rows = await prisma.siteContent.findMany();
        const result: Record<string, unknown> = { ...DEFAULTS };
        for (const row of rows) {
            result[row.key] = row.data;
        }
        return result;
    },

    async getByKey(key: string) {
        const row = await prisma.siteContent.findUnique({ where: { key } });
        return row ? row.data : (DEFAULTS[key] ?? null);
    },

    async upsert(key: string, data: unknown) {
        return prisma.siteContent.upsert({
            where: { key },
            update: { data: data as any },
            create: { key, data: data as any },
        });
    },
};
