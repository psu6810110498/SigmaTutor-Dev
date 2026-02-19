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
  { name: "ประถม", slug: "primary" },
  { name: "ม.ต้น", slug: "middle-school" },
  { name: "ม.ปลาย", slug: "high-school" },
  { name: "TCAS", slug: "tcas" },
  { name: "SAT", slug: "sat" },
  { name: "IELTS", slug: "ielts" },
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
  console.log("🌱 Seeding database...\n");

  // 1. Seed Categories
  console.log("📚 Seeding categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log(`   ✅ ${CATEGORIES.length} categories seeded`);

  // 2. Seed Levels
  console.log("📊 Seeding levels...");
  for (const lvl of LEVELS) {
    await prisma.level.upsert({
      where: { slug: lvl.slug },
      update: { name: lvl.name, order: lvl.order },
      create: lvl,
    });
  }
  console.log(`   ✅ ${LEVELS.length} levels seeded`);

  // 3. Admin Seed
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log("🛡️  Seeding Admin account...");
    const hashedPassword = hashSync(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' as Role },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: "System Admin",
        role: 'ADMIN' as Role,
      },
    });
    console.log(`   ✅ Admin account ensured: ${adminEmail}`);
  } else {
    console.log('   ⚠️  Skipping Admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set');
  }

  // 4. Instructors Seed (8 Personas)
  console.log("👨‍🏫 Seeding Instructors...");
  const instructorPassword = hashSync("password123", 10);
  const INSTRUCTORS = [
    { email: "bas@sigma.com", name: "ครูพี่บาส", nickname: "พี่บาส", title: "Physics Expert", bio: "ปริญญาเอก วิศวะ จุฬาฯ", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bas" },
    { email: "dome@sigma.com", name: "ครูพี่โดม", nickname: "พี่โดม", title: "Social Guru", bio: "ติวเตอร์สังคม-ไทย", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dome" },
    { email: "ann@sigma.com", name: "Teacher Ann", nickname: "Kru Ann", title: "IELTS Specialist", bio: "สำเนียงเป๊ะ เทคนิคเยอะ", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ann" },
    { email: "ton@sigma.com", name: "ครูพี่ต้น", nickname: "พี่ต้น", title: "Chemistry Expert", bio: "เคมีสอนง่าย เข้าใจไว", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ton" },
    { email: "jib@sigma.com", name: "หมอจิ๊บ", nickname: "หมอจิ๊บ", title: "Biology Master", bio: "สอนชีวะด้วย Diagram", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jib" },
    { email: "pop@sigma.com", name: "ครูพี่ป๊อป", nickname: "พี่ป๊อป", title: "Math Expert", bio: "คณิตศาสตร์พื้นฐานถึงขั้นสูง", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pop" },
    { email: "oat@sigma.com", name: "พี่โอ๊ต", nickname: "พี่โอ๊ต", title: "TPAT3 Specialist", bio: "ติวความถนัดวิศวะ", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oat" },
    { email: "mae@sigma.com", name: "ครูพี่เมย์", nickname: "พี่เมย์", title: "English Grammar", bio: "ปูพื้นฐานภาษาอังกฤษ", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mae" }
  ];

  const instructorMap = new Map();
  for (const inst of INSTRUCTORS) {
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      update: { ...inst, role: 'INSTRUCTOR' as Role },
      create: { ...inst, password: instructorPassword, role: 'INSTRUCTOR' as Role },
    });
    instructorMap.set(inst.nickname, user.id);
    console.log(`   👤 Seeded instructor: ${inst.name}`);
  }

  // 5. Sub-Categories (Hierarchical)
  console.log("📂 Seeding Sub-Categories...");
  const seedChildren = async (parentSlug: string, children: { name: string; slug: string }[]) => {
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (!parent) return;
    for (const sub of children) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { parentId: parent.id, name: sub.name },
        create: { ...sub, parentId: parent.id },
      });
    }
  };

  await seedChildren("primary", [{ name: "คณิตประถม", slug: "primary-math" }, { name: "วิทย์ประถม", slug: "primary-science" }]);
  await seedChildren("middle-school", [{ name: "คณิต ม.ต้น", slug: "ms-math" }, { name: "วิทย์ ม.ต้น", slug: "ms-science" }]);
  await seedChildren("high-school", [{ name: "คณิต ม.ปลาย", slug: "hs-math" }, { name: "ฟิสิกส์", slug: "hs-physics" }]);
  await seedChildren("tcas", [{ name: "คณิต A-Level", slug: "tcas-math" }, { name: "ฟิสิกส์ A-Level", slug: "tcas-physics" }, { name: "เคมี A-Level", slug: "tcas-chemistry" }]);
  await seedChildren("ielts", [{ name: "Listening", slug: "ielts-listening" }, { name: "Reading", slug: "ielts-reading" }]);

  // 6. Courses Generation (Full COURSES_DATA)
  console.log("📚 Seeding Courses...");
  const COURSES_DATA = [
    // --- TCAS ---
    { title: "Physics Mechanics A-Level", price: 3500, instructor: "พี่บาส", catSlug: "tcas-physics", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa" },
    { title: "Physics Electromagnetism", price: 3800, instructor: "พี่บาส", catSlug: "tcas-physics", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98" },
    { title: "Math A-Level 1", price: 2900, instructor: "พี่ป๊อป", catSlug: "tcas-math", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1509228468518-180dd4864904" },
    { title: "Organic Chemistry A-Level", price: 3000, instructor: "พี่ต้น", catSlug: "tcas-chemistry", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1532094349884-543bc11b234d" },
    { title: "Biology: Human Body", price: 3200, instructor: "หมอจิ๊บ", catSlug: "tcas-biology", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8" },
    // --- SAT/IELTS ---
    { title: "SAT Math Digital Hack", price: 4500, instructor: "พี่ป๊อป", catSlug: "sat-math", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb" },
    { title: "IELTS 4 Skills Ultimate", price: 8900, instructor: "Kru Ann", catSlug: "ielts", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b" },
    // --- High/Middle School ---
    { title: "Calculus ม.ปลาย", price: 2890, instructor: "พี่ป๊อป", catSlug: "hs-math", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178" },
    { title: "Python สำหรับเริ่มต้น", price: 890, instructor: "พี่โอ๊ต", catSlug: "programming", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1581092921461-eab62e97a783" },
    { title: "Basic Grammar ม.ต้น", price: 1900, instructor: "พี่เมย์", catSlug: "ms-english", type: "ONLINE", thumb: "https://images.unsplash.com/photo-1451226428352-cf66bf8a0317" }
  ];

  for (const c of COURSES_DATA) {
    const cat = await prisma.category.findUnique({ where: { slug: c.catSlug } });
    const instId = instructorMap.get(c.instructor);
    if (!cat || !instId) continue;

    const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    await prisma.course.upsert({
      where: { slug: slug },
      update: {},
      create: {
        title: c.title,
        slug,
        description: `คอร์สเรียน ${c.title} โดย ${c.instructor}`,
        price: c.price,
        originalPrice: c.price * 1.5,
        courseType: c.type as any,
        thumbnail: c.thumb,
        instructorId: instId,
        categoryId: cat.id,
        status: 'PUBLISHED',
        published: true,
      }
    });
    console.log(`   📘 Seeded course: ${c.title}`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });