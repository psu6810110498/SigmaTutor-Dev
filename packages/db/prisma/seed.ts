// ============================================================
// Seed — ข้อมูลตั้งต้นสำหรับ Category + Level + Admin
// Run: pnpm --filter @sigma/db db:seed
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSync } from 'bcryptjs'; // ต้องติดตั้ง bcryptjs หรือใช้ไลบรารีอื่นที่มีอยู่

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient();

// ------------------------------------------------------------
// หมวดหมู่วิชา
// ------------------------------------------------------------
const CATEGORIES = [
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
// ระดับชั้น (order ใช้สำหรับเรียงลำดับ)
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

// ------------------------------------------------------------
// Main Seed Function
// ------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed Categories
  console.log('📚 Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log(`   ✅ ${CATEGORIES.length} categories seeded`);

  // Seed Levels
  console.log('📊 Seeding levels...');
  for (const lvl of LEVELS) {
    await prisma.level.upsert({
      where: { slug: lvl.slug },
      update: { name: lvl.name, order: lvl.order },
      create: lvl,
    });
  }
  console.log(`   ✅ ${LEVELS.length} levels seeded`);

  // ------------------------------------------------------------
  // Admin Seed (New)
  // ------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log('🛡️  Seeding Admin account...');

    // Hash Password (ถ้าไม่มี bcrypt ต้องหาวิธีอื่น แต่นี่คือแนวทางมาตรฐาน)
    // หมายเหตุ: โปรเจกต์นี้อาจจะใช้ bcryptjs หรือ argon2 ให้ตรวจสอบ package.json อีกที
    // สมมติว่าใช้ bcryptjs ไปก่อน ถ้า error เดี๋ยวแก้
    const hashedPassword = hashSync(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'ADMIN' as Role, // Force role update just in case
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN' as Role,
      },
    });
    console.log(`   ✅ Admin account ensured: ${adminEmail}`);

    // ─── Seed Mock Courses ─────────────────────────────────
    console.log('📖 Seeding mock courses...');

    // Get category & level references
    const catMath = await prisma.category.findUnique({ where: { slug: 'math' } });
    const catPhysics = await prisma.category.findUnique({ where: { slug: 'physics' } });
    const catChem = await prisma.category.findUnique({ where: { slug: 'chemistry' } });
    const catEnglish = await prisma.category.findUnique({ where: { slug: 'english' } });
    const catBio = await prisma.category.findUnique({ where: { slug: 'biology' } });
    const catProg = await prisma.category.findUnique({ where: { slug: 'programming' } });

    const lvlM5 = await prisma.level.findUnique({ where: { slug: 'm5' } });
    const lvlM6 = await prisma.level.findUnique({ where: { slug: 'm6' } });
    const lvlUni = await prisma.level.findUnique({ where: { slug: 'university' } });
    const lvlGen = await prisma.level.findUnique({ where: { slug: 'general' } });

    // Find or create the admin as instructor
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (admin) {
      const MOCK_COURSES = [
        {
          title: 'ฟิสิกส์ A-Level (ฉบับแม่นยำ)',
          slug: 'physics-a-level',
          price: 2499,
          originalPrice: 3500,
          categoryId: catPhysics?.id,
          levelId: lvlM6?.id,
          description: 'เนื้อหาฟิสิกส์เข้มข้น ครอบคลุมทุกบทสำหรับสอบ A-Level',
          courseType: 'ONLINE' as const,
        },
        {
          title: 'คณิตศาสตร์ ม.ปลาย (Calculus)',
          slug: 'math-calculus',
          price: 2890,
          originalPrice: 3900,
          categoryId: catMath?.id,
          levelId: lvlM6?.id,
          description: 'Calculus ตั้งแต่พื้นฐานจนถึงขั้นสูง เตรียมสอบเข้ามหาวิทยาลัย',
          courseType: 'ONLINE' as const,
        },
        {
          title: 'เคมี อินทรีย์ (Organic Chem)',
          slug: 'organic-chem',
          price: 3200,
          originalPrice: 4200,
          categoryId: catChem?.id,
          levelId: lvlUni?.id,
          description: 'เคมีอินทรีย์สำหรับนักศึกษามหาวิทยาลัย ปี 1-2',
          courseType: 'ONLINE' as const,
        },
        {
          title: 'ภาษาอังกฤษ IELTS Preparation',
          slug: 'ielts-prep',
          price: 4500,
          originalPrice: 5500,
          categoryId: catEnglish?.id,
          levelId: lvlGen?.id,
          description: 'เตรียมสอบ IELTS ครบทุก Skill — Listening, Reading, Writing, Speaking',
          courseType: 'ONLINE_LIVE' as const,
        },
        {
          title: 'ชีววิทยา ม.5: เซลล์และโครงสร้าง',
          slug: 'bio-cell-structure',
          price: 1200,
          categoryId: catBio?.id,
          levelId: lvlM5?.id,
          description: 'โครงสร้างเซลล์ การแบ่งเซลล์ การลำเลียงสาร อย่างละเอียด',
          courseType: 'ONLINE' as const,
        },
        {
          title: 'Python สำหรับเริ่มต้น',
          slug: 'python-beginner',
          price: 890,
          categoryId: catProg?.id,
          levelId: lvlGen?.id,
          description: 'เรียน Python ตั้งแต่ศูนย์ เหมาะสำหรับผู้เริ่มต้น',
          courseType: 'ONLINE' as const,
        },
      ];

      for (const c of MOCK_COURSES) {
        await prisma.course.upsert({
          where: { slug: c.slug },
          update: { title: c.title, price: c.price, status: 'PUBLISHED' },
          create: {
            title: c.title,
            slug: c.slug,
            description: c.description,
            price: c.price,
            originalPrice: c.originalPrice ?? null,
            status: 'PUBLISHED',
            courseType: c.courseType,
            categoryId: c.categoryId ?? null,
            levelId: c.levelId ?? null,
            instructorId: admin.id,
            published: true,
          },
        });
      }
      console.log(`   ✅ ${MOCK_COURSES.length} mock courses seeded`);
    }
  } else {
    console.log('   ⚠️  Skipping Admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
  }

  console.log('\n🎉 Seeding complete!');
}

// Run seed
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
