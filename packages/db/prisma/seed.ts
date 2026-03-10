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

  const INSTRUCTORS = [
    {
      email: 'bas@sigma.com',
      name: 'ครูพี่บาส',
      nickname: 'พี่บาส',
      title: 'Physics Expert & Engineering Tutor',
      bio: 'ปริญญาเอก วิศวกรรมศาสตร์ จุฬาฯ ประสบการณ์สอนฟิสิกส์กว่า 15 ปี เน้นความเข้าใจ ไม่ต้องท่องจำ',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bas&gender=male&clothing=blazerAndShirt',
    },
    {
      email: 'dome@sigma.com',
      name: 'ครูพี่โดม',
      nickname: 'พี่โดม',
      title: 'Social Studies & Thai Guru',
      bio: 'ติวเตอร์สังคม-ไทย อารมณ์ดี เล่าเรื่องสนุก เข้าใจง่าย เกร็งข้อสอบแม่นยำ',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dome&gender=male',
    },
    {
      email: 'ann@sigma.com',
      name: 'Teacher Ann',
      nickname: 'Kru Ann',
      title: 'IELTS/SAT/GED Specialist',
      bio: 'จบจากต่างประเทศ สำเนียงเป๊ะ สอนเทคนิคทำข้อสอบ Inter ให้ได้คะแนนพุ่ง',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Ann&gender=female&clothing=blazerAndShirt',
    },
    {
      email: 'ton@sigma.com',
      name: 'ครูพี่ต้น',
      nickname: 'พี่ต้น',
      title: 'Chemistry & Science Expert',
      bio: 'เคมีจะไม่ใช่เรื่องยากอีกต่อไป ด้วยเทคนิคการจำตารางธาตุและการคำนวณที่เข้าใจง่าย',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Ton&gender=male&glasses=prescription02',
    },
    {
      email: 'jib@sigma.com',
      name: 'หมอจิ๊บ',
      nickname: 'หมอจิ๊บ',
      title: 'Biology Diagram Master',
      bio: 'นศ.แพทย์ ที่จะมาสอนชีวะด้วยภาพ Diagram ให้จำได้แม่น ไม่มีลืม',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jib&gender=female&clothing=shirtScoopNeck',
    },
    {
      email: 'pop@sigma.com',
      name: 'ครูพี่ป๊อป',
      nickname: 'พี่ป๊อป',
      title: 'Math Foundation to Calculus',
      bio: 'คณิตศาสตร์ ม.ต้น ถึง ม.ปลาย ปูพื้นฐานให้แน่น พร้อมลุยสนามสอบ',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Pop&gender=male&top=shortHairDreads01',
    },
    {
      email: 'oat@sigma.com',
      name: 'พี่โอ๊ต',
      nickname: 'พี่โอ๊ต',
      title: 'TPAT3 & Engineering Math',
      bio: 'วิศวะ ลาดกระบัง สอนความถนัดวิศวะและคณิตประยุกต์ เจาะลึกข้อสอบจริง',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Oat&gender=male&facialHair=beardLight',
    },
    {
      email: 'mae@sigma.com',
      name: 'ครูพี่เมย์',
      nickname: 'พี่เมย์',
      title: 'English Grammar & GAT',
      bio: 'แกรมม่าร์แม่น ศัพท์ปัง สอนละเอียด เข้าใจง่าย สำหรับคนพื้นฐานน้อย',
      profileImage:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Mae&gender=female&hair=longHairStraight',
    },
  ];

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
  // Courses Generation
  // ------------------------------------------------------------
  console.log('📚 Seeding Courses...');

  const COURSES_DATA = [
    // === TCAS ===
    // Physics - Kru Bas
    {
      title: 'Physics Mechanics A-Level (กลศาสตร์)',
      price: 3500,
      instructor: 'พี่บาส',
      catSlug: 'tcas-physics',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Physics Electromagnetism (ไฟฟ้าและแม่เหล็ก)',
      price: 3800,
      promo: 3200,
      instructor: 'พี่บาส',
      catSlug: 'tcas-physics',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'ตะลุยโจทย์ฟิสิกส์ A-Level 67',
      price: 1500,
      instructor: 'พี่บาส',
      catSlug: 'tcas-physics',
      type: 'ONLINE_LIVE',
      thumb:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
      bestSeller: true,
    },
    // Math - Kru Pop
    {
      title: 'Math A-Level 1: เซต ตรรกศาสตร์ จำนวนจริง',
      price: 2900,
      promo: 2500,
      instructor: 'พี่ป๊อป',
      catSlug: 'tcas-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Calculus & Statistics A-Level (แคลคูลัสและสถิติ)',
      price: 3500,
      instructor: 'พี่ป๊อป',
      catSlug: 'tcas-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1000&auto=format&fit=crop',
      bestSeller: true,
    },
    // Chem - Kru Ton
    {
      title: 'Chemistry: ปริมาณสารสัมพันธ์ A-Level',
      price: 2500,
      instructor: 'พี่ต้น',
      catSlug: 'tcas-chemistry',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Organic Chemistry A-Level (เคมีอินทรีย์)',
      price: 3000,
      promo: 2490,
      instructor: 'พี่ต้น',
      catSlug: 'tcas-chemistry',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=1000&auto=format&fit=crop',
    },
    // Bio - Dr. Jib
    {
      title: 'Biology A-Level: ระบบร่างกายมนุษย์',
      price: 3200,
      instructor: 'หมอจิ๊บ',
      catSlug: 'tcas-biology',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Biology A-Level: พันธุศาสตร์',
      price: 2800,
      instructor: 'หมอจิ๊บ',
      catSlug: 'tcas-biology',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop',
      bestSeller: true,
    },
    // Social/Thai - Kru Dome
    {
      title: 'Social Studies A-Level: สรุปข่าวและเหตุการณ์ปัจจุบัน',
      price: 1200,
      instructor: 'พี่โดม',
      catSlug: 'tcas-social',
      type: 'ONLINE_LIVE',
      thumb:
        'https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'ภาษาไทย A-Level: หลักภาษาและการใช้ภาษา',
      price: 2200,
      instructor: 'พี่โดม',
      catSlug: 'tcas-thai',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
    },
    // TGAT
    {
      title: 'TGAT: การคิดอย่างมีเหตุผล + Conversation',
      price: 2900,
      instructor: 'พี่โดม',
      catSlug: 'tcas-tgat',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop',
    },
    // TPAT3
    {
      title: 'TPAT3 ความถนัดทางวิศวกรรม',
      price: 4200,
      instructor: 'พี่โอ๊ต',
      catSlug: 'tcas-tpat3',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1581092921461-eab62e97a783?q=80&w=1000&auto=format&fit=crop',
    },

    // === SAT ===
    {
      title: 'SAT Math Digital: Hack โจทย์คณิตอินเตอร์',
      price: 4500,
      instructor: 'พี่ป๊อป',
      catSlug: 'sat-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'SAT Reading & Writing Techniques',
      price: 5500,
      instructor: 'Kru Ann',
      catSlug: 'sat-rw',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000&auto=format&fit=crop',
    },

    // === IELTS ===
    {
      title: 'IELTS 4 Skills Ultimate Pack',
      price: 8900,
      promo: 6990,
      instructor: 'Kru Ann',
      catSlug: 'ielts-listening', // Main body under listening, covers all
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop',
      bestSeller: true,
    },
    {
      title: 'IELTS Writing Task 1 & 2: Band 7+ Strategy',
      price: 3900,
      instructor: 'Kru Ann',
      catSlug: 'ielts-writing',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'IELTS Speaking: เทคนิคพูดให้ได้ Band 7',
      price: 2900,
      instructor: 'Kru Ann',
      catSlug: 'ielts-speaking',
      type: 'ONLINE_LIVE',
      thumb:
        'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop',
    },

    // === ม.ปลาย ===
    {
      title: 'คณิต ม.ปลาย: ฟังก์ชันและตรีโกณมิติ',
      price: 2500,
      instructor: 'พี่ป๊อป',
      catSlug: 'hs-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'ฟิสิกส์ ม.ปลาย: คลื่นและแสง',
      price: 2800,
      instructor: 'พี่บาส',
      catSlug: 'hs-physics',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'เคมี ม.ปลาย: กรด-เบส และสมดุลเคมี',
      price: 2600,
      instructor: 'พี่ต้น',
      catSlug: 'hs-chemistry',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
    },

    // === ม.ต้น ===
    {
      title: 'คณิต ม.ต้น: พีชคณิตและเรขาคณิต',
      price: 2200,
      instructor: 'พี่ป๊อป',
      catSlug: 'ms-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'วิทย์ ม.ต้น ฉบับสมบูรณ์',
      price: 3500,
      instructor: 'พี่ต้น',
      catSlug: 'ms-science',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Basic Grammar for ม.ต้น',
      price: 1900,
      instructor: 'พี่เมย์',
      catSlug: 'ms-english',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1451226428352-cf66bf8a0317?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Vocab ม.ต้น: ศัพท์พื้นฐาน 2000 คำ',
      price: 1500,
      promo: 990,
      instructor: 'พี่เมย์',
      catSlug: 'ms-english',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1000&auto=format&fit=crop',
    },

    // === ประถม ===
    {
      title: 'คณิตประถม: บวก ลบ คูณ หาร สนุกๆ',
      price: 1200,
      instructor: 'พี่ป๊อป',
      catSlug: 'primary-math',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'วิทย์ประถม: สำรวจโลกรอบตัว',
      price: 1200,
      instructor: 'พี่ต้น',
      catSlug: 'primary-science',
      type: 'ONLINE',
      thumb:
        'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  for (const c of COURSES_DATA) {
    const catId = await getCatId(c.catSlug);
    const instId = instructorMap.get(c.instructor);

    if (!catId || !instId) {
      console.log(`⚠️  Skipping ${c.title} (Missing Cat/Inst)`);
      continue;
    }

    const slug =
      c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    await prisma.course.upsert({
      where: { slug: slug },
      update: {},
      create: {
        title: c.title,
        slug: slug,
        description: `คอร์สเรียน ${c.title} โดย ${c.instructor} เน้นความเข้าใจ ปูพื้นฐานแน่น พร้อมลุยโจทย์จริง`,
        price: c.price,
        originalPrice: c.price * 1.5,
        promotionalPrice: c.promo || null,
        courseType: c.type as any,
        thumbnail: c.thumb,
        teacherId: instId,
        categoryId: catId,
        status: 'PUBLISHED',
        published: true,
        isBestSeller: c.bestSeller || false,
        duration: '25 ชม.',
        videoCount: 15,
      },
    });
    console.log(`   📘 Seeded course: ${c.title}`);
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
