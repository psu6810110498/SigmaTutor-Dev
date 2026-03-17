// ============================================================
// Seed — ข้อมูลตั้งต้นสำหรับ Category + Level + Admin
// Run: pnpm --filter @sigma/db db:seed
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

// ------------------------------------------------------------
// หมวดหมู่วิชา (Combined from both branches)
// ------------------------------------------------------------
const CATEGORIES = [
  // === Root Categories (Quick Filters) ===
  { name: 'ประถม', slug: 'primary' },
  { name: 'ม.ต้น', slug: 'middle-school' },
  { name: 'ม.ปลาย', slug: 'high-school' },
  { name: 'TCAS', slug: 'tcas' },
  { name: 'SAT', slug: 'sat' },
  { name: 'IELTS', slug: 'ielts' },
  // === Subject Categories ===
  { name: 'คณิตศาสตร์', slug: 'math' },
  { name: 'ฟิสิกส์', slug: 'physics' },
  { name: 'เคมี', slug: 'chemistry' },
  { name: 'ชีววิทยา', slug: 'biology' },
  { name: 'ภาษาอังกฤษ', slug: 'english' },
  { name: 'ภาษาไทย', slug: 'thai' },
  { name: 'สังคมศึกษา', slug: 'social' },
  { name: 'PAT', slug: 'pat' },
  { name: 'GAT', slug: 'gat' },
  { name: 'โปรแกรมมิ่ง', slug: 'programming' },
];

// ------------------------------------------------------------
// ระดับชั้น
// ------------------------------------------------------------
const LEVELS = [
  { name: 'ม.1', slug: 'm1', order: 1 },
  { name: 'ม.2', slug: 'm2', order: 2 },
  { name: 'ม.3', slug: 'm3', order: 3 },
  { name: 'ม.4', slug: 'm4', order: 4 },
  { name: 'ม.5', slug: 'm5', order: 5 },
  { name: 'ม.6', slug: 'm6', order: 6 },
  { name: 'มหาวิทยาลัย', slug: 'university', order: 7 },
  { name: 'ทั่วไป', slug: 'general', order: 8 },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  console.log('🗑️  Deleting all existing categories...');
  const deletedCount = await prisma.category.deleteMany({});
  console.log(`   ✅ Deleted ${deletedCount.count} existing categories`);

  console.log('📚 Seeding root categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.create({
      data: cat,
    });
  }
  console.log(`   ✅ ${CATEGORIES.length} root categories seeded`);

  console.log('📊 Seeding levels...');
  for (const lvl of LEVELS) {
    await prisma.level.upsert({
      where: { slug: lvl.slug },
      update: { name: lvl.name, order: lvl.order },
      create: lvl,
    });
  }
  console.log(`   ✅ ${LEVELS.length} levels seeded`);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log('🛡️  Seeding Admin account...');
    const hashedPassword = hashSync(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' as Role },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN' as Role,
      },
    });
    console.log(`   ✅ Admin account ensured: ${adminEmail}`);
  } else {
    console.log('   ⚠️  Skipping Admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set');
  }

  // Default password for instructors
  const instructorPassword = hashSync('password123', 10);

  const names = ['พี่บาส', 'พี่โดม', 'Kru Ann', 'พี่ต้น', 'หมอจิ๊บ', 'พี่ป๊อป', 'พี่โอ๊ต', 'พี่เมย์', 'พี่นนท์', 'ครูผึ้ง', 'พี่กิต', 'โค้ชแม็กซ์', 'พี่เจมส์', 'Kru Alice', 'พี่วอร์ม'];
  const titles = ['Physics Expert', 'Social Studies Guru', 'IELTS Specialist', 'Chemistry Master', 'Biology Expert', 'Math Foundation', 'Engineering Math', 'English Grammar', 'Programming Coach', 'Science Teacher', 'General Science', 'Business Math', 'IT Master', 'Language Specialist', 'Test Prep Guru'];
  const INSTRUCTORS = Array.from({ length: 15 }).map((_, i) => {
    const id = i + 1;
    return {
      email: `teacher${id}@sigma.com`,
      name: `ครู${names[i]}`,
      nickname: names[i],
      title: titles[i],
      bio: `อาจารย์คุณภาพประสบการณ์กว่า 10 ปี จบการศึกษาจากมหาวิทยาลัยชั้นนำ เน้นการสอนให้เข้าใจง่ายและประยุกต์ใช้ได้จริงในทุกสนามสอบ`,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor${id}&gender=${i % 2 === 0 ? 'male' : 'female'}&clothing=blazerAndShirt`,
    };
  });

  const instructorMap = new Map();

  console.log('👨‍🏫 Seeding Instructors...');
  for (const inst of INSTRUCTORS) {
    const teacher = await prisma.teacher.upsert({
      where: { email: inst.email },
      update: {
        name: inst.name,
        nickname: inst.nickname,
        title: inst.title,
        bio: inst.bio,
        profileImage: inst.profileImage,
      },
      create: {
        email: inst.email,
        name: inst.name,
        nickname: inst.nickname,
        title: inst.title,
        bio: inst.bio,
        profileImage: inst.profileImage,
      },
    });
    instructorMap.set(inst.nickname, teacher.id);
    console.log(`   👤 Seeded instructor: ${inst.name}`);
  }

  // ------------------------------------------------------------
  // Detailed Categories (Child Categories)
  // ------------------------------------------------------------
  console.log('📂 Seeding Sub-Categories...');

  // Helper to find parent ID
  const getCatId = async (slug: string) => {
    const cat = await prisma.category.findUnique({ where: { slug } });
    return cat?.id;
  };

  // Helper to seed children
  const seedChildren = async (parentSlug: string, children: { name: string; slug: string }[]) => {
    const parentId = await getCatId(parentSlug);
    if (!parentId) {
      console.warn(`⚠️ Parent "${parentSlug}" not found`);
      return;
    }
    for (const sub of children) {
      await prisma.category.create({
        data: { ...sub, parentId },
      });
    }
  };

  await seedChildren('primary', [
    { name: 'คณิตประถม', slug: 'primary-math' },
    { name: 'วิทย์ประถม', slug: 'primary-science' },
    { name: 'อังกฤษประถม', slug: 'primary-english' },
    { name: 'ภาษาไทยประถม', slug: 'primary-thai' },
    { name: 'โปรแกรมมิ่ง', slug: 'primary-programming' },
  ]);

  // ม.ต้น
  await seedChildren('middle-school', [
    { name: 'คณิต ม.ต้น', slug: 'ms-math' },
    { name: 'วิทย์ ม.ต้น', slug: 'ms-science' },
    { name: 'อังกฤษ ม.ต้น', slug: 'ms-english' },
    { name: 'ภาษาไทย ม.ต้น', slug: 'ms-thai' },
    { name: 'สังคม ม.ต้น', slug: 'ms-social' },
    { name: 'โปรแกรมมิ่ง', slug: 'ms-programming' },
  ]);

  // ม.ปลาย
  await seedChildren('high-school', [
    { name: 'คณิต ม.ปลาย', slug: 'hs-math' },
    { name: 'ฟิสิกส์', slug: 'hs-physics' },
    { name: 'เคมี', slug: 'hs-chemistry' },
    { name: 'ชีววิทยา', slug: 'hs-biology' },
    { name: 'อังกฤษ ม.ปลาย', slug: 'hs-english' },
    { name: 'ภาษาไทย ม.ปลาย', slug: 'hs-thai' },
    { name: 'สังคม ม.ปลาย', slug: 'hs-social' },
    { name: 'โปรแกรมมิ่ง', slug: 'hs-programming' },
  ]);

  // TCAS
  await seedChildren('tcas', [
    { name: 'คณิตศาสตร์ A-Level', slug: 'tcas-math' },
    { name: 'ฟิสิกส์ A-Level', slug: 'tcas-physics' },
    { name: 'เคมี A-Level', slug: 'tcas-chemistry' },
    { name: 'ชีววิทยา A-Level', slug: 'tcas-biology' },
    { name: 'อังกฤษ A-Level', slug: 'tcas-english' },
    { name: 'ภาษาไทย A-Level', slug: 'tcas-thai' },
    { name: 'สังคม A-Level', slug: 'tcas-social' },
    { name: 'TGAT', slug: 'tcas-tgat' },
    { name: 'TPAT1', slug: 'tcas-tpat1' },
    { name: 'TPAT3', slug: 'tcas-tpat3' },
  ]);

  // SAT
  await seedChildren('sat', [
    { name: 'SAT Math', slug: 'sat-math' },
    { name: 'SAT Reading & Writing', slug: 'sat-rw' },
  ]);

  // IELTS
  await seedChildren('ielts', [
    { name: 'Listening', slug: 'ielts-listening' },
    { name: 'Reading', slug: 'ielts-reading' },
    { name: 'Writing', slug: 'ielts-writing' },
    { name: 'Speaking', slug: 'ielts-speaking' },
  ]);

  // Count total child categories
  const totalChildCategories = await prisma.category.count({
    where: { parentId: { not: null } },
  });
  console.log(`   ✅ ${totalChildCategories} child categories seeded`);

  // ------------------------------------------------------------
  // Courses Generation (Scale Up Bulk Data & Strict Boundaries)
  // ------------------------------------------------------------
  console.log('🗑️  Deleting existing courses...');
  await prisma.course.deleteMany({});

  console.log('📚 Seeding 30 Courses (10 ONLINE, 10 ONLINE_LIVE, 10 ONSITE)...');

  const categories = await prisma.category.findMany();
  const teachers = await prisma.teacher.findMany();

  if (categories.length === 0 || teachers.length === 0) {
    console.error('❌ Missing category or instructor, cannot seed courses');
    return;
  }

  const COURSE_TYPES = ['ONLINE', 'ONLINE_LIVE', 'ONSITE'];
  const THUMBNAILS = [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=1000&auto=format&fit=crop',
  ];

  const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Thai', 'Programming', 'SAT', 'IELTS'];

  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const typeIndex = i % 3;
    const courseType = COURSE_TYPES[typeIndex];
    const teacher = teachers[i % teachers.length];
    const category = categories[i % categories.length];
    const thumb = THUMBNAILS[i % THUMBNAILS.length];
    const subject = SUBJECTS[i % SUBJECTS.length];

    const course = await prisma.course.create({
      data: {
        title: `${subject} Mastery Bootcamp ${i + 1} (${courseType})`,
        slug: `course-${subject.toLowerCase().replace(/ /g, '-')}-${i + 1}-${Date.now()}`,
        description: `This is a comprehensive ${courseType} course focusing on ${subject}. Master the concepts and excel in your exams. Limits are set high so everyone can enroll.`,
        price: 2500 + (i * 100),
        originalPrice: 4000 + (i * 100),
        courseType: courseType as any,
        thumbnail: thumb,
        teacherId: teacher.id,
        categoryId: category.id,
        status: 'PUBLISHED',
        published: true,
        duration: '10 ชม.',
        videoCount: courseType === 'ONLINE' ? 5 : 0,
        maxSeats: 50,
        enrollStartDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        enrollEndDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now (future)
        location: courseType === 'ONSITE' ? `ห้องเรียนที่ ${i + 1}01 อาคาร B` : null,
      }
    });

    // Seed content strictly based on type
    if (courseType === 'ONLINE') {
      const chapter = await prisma.chapter.create({
        data: {
          title: `บทนำ: พื้นฐาน ${subject}`,
          order: 1,
          courseId: course.id,
        }
      });
      await prisma.lesson.createMany({
        data: [
          {
            title: `EP.1 แนะนำ ${subject}`,
            type: 'VIDEO',
            videoProvider: 'YOUTUBE',
            youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
            duration: 30,
            order: 1,
            chapterId: chapter.id,
            isFree: true,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          },
          {
            title: `EP.2 เจาะลึกเนื้อหา`,
            type: 'VIDEO',
            videoProvider: 'YOUTUBE',
            youtubeUrl: 'https://youtu.be/kJQP7kiw5Fk',
            duration: 45,
            order: 2,
            chapterId: chapter.id,
            isFree: false,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }
        ]
      });
    } else if (courseType === 'ONLINE_LIVE') {
      await prisma.courseSchedule.createMany({
        data: [
          {
            sessionNumber: 1,
            date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 
            startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), 
            topic: `Session 1: Live ${subject}`,
            isOnline: true,
            zoomLink: 'https://zoom.us/j/1234567890',
            status: 'ON_SCHEDULE',
            courseId: course.id,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          },
          {
            sessionNumber: 2,
            date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), 
            startTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), 
            topic: `Session 2: Live Workshop ${subject}`,
            isOnline: true,
            zoomLink: 'https://zoom.us/j/1234567890',
            status: 'ON_SCHEDULE',
            courseId: course.id,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }
        ]
      });
    } else if (courseType === 'ONSITE') {
      await prisma.courseSchedule.createMany({
        data: [
          {
            sessionNumber: 1,
            date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), 
            startTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), 
            topic: `Class 1: Onsite ${subject}`,
            location: `ห้องเรียน ${i + 1}01`,
            isOnline: false,
            status: 'ON_SCHEDULE',
            courseId: course.id,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          },
          {
            sessionNumber: 2,
            date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), 
            startTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), 
            topic: `Class 2: Onsite Practice ${subject}`,
            location: `ห้องเรียน ${i + 1}01`,
            isOnline: false,
            status: 'ON_SCHEDULE',
            courseId: course.id,
            materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }
        ]
      });
    }
    
    console.log(`   📘 Seeded ${courseType} course: ${course.title}`);
  }

  // ----------------------------------------------------------------
  // Site Content (Homepage CMS)
  // ----------------------------------------------------------------
  console.log('\n🏠 Seeding site content...');

  const SITE_CONTENT: { key: string; data: unknown }[] = [
    {
      key: 'students',
      data: [
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์', color: 'from-blue-400 to-indigo-600', image: null },
        { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาไฟฟ้า', color: 'from-purple-400 to-blue-600', image: null },
        { faculty: 'แพทยศาสตร์', major: 'คณะแพทยศาสตร์', color: 'from-cyan-400 to-blue-500', image: null },
        { faculty: 'สถาปัตยกรรมศาสตร์', major: 'สาขาออกแบบ', color: 'from-indigo-400 to-purple-600', image: null },
      ],
    },
    {
      key: 'stats',
      data: [
        { value: '10,000+', label: 'นักเรียนที่ไว้วางใจ' },
        { value: '40+', label: 'คอร์สเรียนคุณภาพ' },
        { value: '98%', label: 'สอบคณะที่หวัง' },
      ],
    },
    {
      key: 'universities',
      data: [
        { name: 'จุฬาฯ', abbr: 'จฬ', bg: 'bg-pink-100', text: 'text-pink-600' },
        { name: 'มหิดล', abbr: 'มห', bg: 'bg-blue-100', text: 'text-blue-600' },
        { name: 'ธรรมศาสตร์', abbr: 'ธศ', bg: 'bg-red-100', text: 'text-red-600' },
        { name: 'เกษตรฯ', abbr: 'กษ', bg: 'bg-green-100', text: 'text-green-600' },
        { name: 'ลาดกระบัง', abbr: 'ลก', bg: 'bg-orange-100', text: 'text-orange-600' },
        { name: 'มจธ.', abbr: 'มจ', bg: 'bg-purple-100', text: 'text-purple-600' },
      ],
    },
    {
      key: 'tutors',
      data: [
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
        {
          name: 'พี่แนน (ณัชช์พิชา จิตธนะอ่อน)',
          subject: 'วิชา: คณิตศาสตร์',
          desc: 'ผ่านสนามสอบคณิตโอลิมปิกระดับนานาชาติ เน้นสอนให้เข้าใจลึกและแก้โจทย์ได้ทุกรูปแบบ',
          initial: 'น',
          color: 'from-rose-400 to-pink-600',
          image: null,
        },
      ],
    },
    {
      key: 'testimonial',
      data: {
        quote: 'จากที่เกลียดฟิสิกส์ กลายเป็นวิชาทำคะแนน! เทคนิคของพี่บอสช่วยให้มองงานยากกว่าออก ไม่ต้องท่องสูตร สอบติด วิศวกรรมคอมพิวเตอร์ ม.ดัง มาแล้ว ขอบคุณมากๆ',
        name: 'น้องพลอย',
        faculty: 'วิศวกรรมศาสตร์ สาขาคอมพิวเตอร์',
        image: null,
      },
    },
    {
      key: 'faqs',
      data: [
        {
          q: 'เรียนผ่าน iPad หรือมือถือได้ไหม?',
          a: 'ได้เลย! ระบบรองรับทุกอุปกรณ์ ทั้ง iPad, มือถือ, แท็บเล็ต และคอมพิวเตอร์ ไม่ต้องติดตั้งแอปเพิ่มเติม',
        },
        {
          q: 'สมัครเรียนได้เลยไหมหรือต้องรอ?',
          a: 'สมัครได้เลยทันที หลังสมัครสามารถเข้าเรียนได้ภายใน 24 ชั่วโมง ไม่มีค่าสมัครเพิ่มเติม',
        },
        {
          q: 'มีคอร์สเรียนสดด้วย เรียนที่ไหนได้บ้าง?',
          a: 'มีทั้งคอร์สออนไลน์และ Live สด สามารถเรียนได้จากทุกที่ผ่านระบบออนไลน์ของเรา',
        },
        {
          q: 'ถ้าดูคลิปแล้วไม่เข้าใจทำอย่างไรดี?',
          a: 'สามารถถามตอบได้ผ่านระบบ Q&A ในแต่ละบทเรียน ทีมติวเตอร์จะตอบภายใน 24 ชั่วโมง',
        },
        {
          q: 'คอร์สดูได้นานแค่ไหน?',
          a: 'เข้าถึงได้ตลอดชีพหลังจากซื้อคอร์ส ไม่มีวันหมดอายุ สามารถกลับมาทบทวนได้ทุกเมื่อ',
        },
      ],
    },
  ];

  for (const item of SITE_CONTENT) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { data: item.data as any },
      create: { key: item.key, data: item.data as any },
    });
    console.log(`   ✅ site_content[${item.key}] seeded`);
  }

  console.log('\n🎉 Seeding complete!');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
