// ============================================================
// Mock Data Seed — ข้อมูลจำลองสำหรับทดสอบ User Flow
// Run once: pnpm --filter @sigma/db db:seed:mock
// ============================================================
// สร้าง: Learners, Chapters/Lessons, Payments, Enrollments, Reviews, Banners
// ⚠️  ต้องรัน seed.ts (db:seed) ก่อน เพื่อให้มี Categories, Levels, Instructors, Courses
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

// ------------------------------------------------------------
// Learner Users (นักเรียน)
// ------------------------------------------------------------
const LEARNERS = [
  {
    email: 'somchai@test.com',
    name: 'สมชาย ใจดี',
    nickname: 'ชาย',
    phone: '081-234-5678',
    school: 'โรงเรียนเตรียมอุดมศึกษา',
    province: 'กรุงเทพมหานคร',
    educationLevel: 'ม.6',
  },
  {
    email: 'suda@test.com',
    name: 'สุดา รักเรียน',
    nickname: 'ดา',
    phone: '082-345-6789',
    school: 'โรงเรียนสาธิต มศว',
    province: 'กรุงเทพมหานคร',
    educationLevel: 'ม.5',
  },
  {
    email: 'nat@test.com',
    name: 'ณัฐพล เก่งมาก',
    nickname: 'ณัฐ',
    phone: '083-456-7890',
    school: 'โรงเรียนมหิดลวิทยานุสรณ์',
    province: 'นครปฐม',
    educationLevel: 'ม.4',
  },
  {
    email: 'ploy@test.com',
    name: 'พลอย สว่างใส',
    nickname: 'พลอย',
    phone: '084-567-8901',
    school: 'โรงเรียนเซนต์โยเซฟคอนเวนต์',
    province: 'กรุงเทพมหานคร',
    educationLevel: 'ม.3',
  },
  {
    email: 'tong@test.com',
    name: 'ธนกร มุ่งมั่น',
    nickname: 'ต้อง',
    phone: '085-678-9012',
    school: 'โรงเรียนสวนกุหลาบวิทยาลัย',
    province: 'กรุงเทพมหานคร',
    educationLevel: 'ม.6',
  },
];

// ------------------------------------------------------------
// Chapter & Lesson Templates
// ------------------------------------------------------------
const CHAPTER_TEMPLATES = [
  {
    title: 'บทที่ 1: แนะนำและปูพื้นฐาน',
    lessons: [
      { title: '1.1 แนะนำคอร์สเรียน', type: 'VIDEO', duration: 600 },
      { title: '1.2 พื้นฐานที่ต้องรู้', type: 'VIDEO', duration: 1200 },
      { title: '1.3 เอกสารประกอบบทที่ 1', type: 'FILE', duration: null },
    ],
  },
  {
    title: 'บทที่ 2: เนื้อหาหลัก (ตอนที่ 1)',
    lessons: [
      { title: '2.1 ทฤษฎีและแนวคิดสำคัญ', type: 'VIDEO', duration: 1800 },
      { title: '2.2 ตัวอย่างและการประยุกต์', type: 'VIDEO', duration: 1500 },
      { title: '2.3 แบบฝึกหัดบทที่ 2', type: 'QUIZ', duration: null },
    ],
  },
  {
    title: 'บทที่ 3: เนื้อหาหลัก (ตอนที่ 2)',
    lessons: [
      { title: '3.1 เจาะลึกประเด็นสำคัญ', type: 'VIDEO', duration: 2100 },
      { title: '3.2 โจทย์ยากและเทคนิคลัด', type: 'VIDEO', duration: 1800 },
      { title: '3.3 เอกสารสรุปบทที่ 3', type: 'FILE', duration: null },
    ],
  },
  {
    title: 'บทที่ 4: สรุปและลุยข้อสอบ',
    lessons: [
      { title: '4.1 สรุปรวมเนื้อหาทั้งหมด', type: 'VIDEO', duration: 1200 },
      { title: '4.2 ตะลุยข้อสอบจริง Part 1', type: 'VIDEO', duration: 2400 },
      { title: '4.3 ตะลุยข้อสอบจริง Part 2', type: 'VIDEO', duration: 2400 },
      { title: '4.4 ข้อสอบ Mock Exam', type: 'QUIZ', duration: null },
    ],
  },
];

// ------------------------------------------------------------
// Review Comments
// ------------------------------------------------------------
const REVIEW_COMMENTS = [
  { rating: 5, comment: 'สอนดีมากครับ เข้าใจง่าย เนื้อหาครบถ้วน แนะนำเลย!' },
  { rating: 5, comment: 'เทคนิคดีมาก ทำโจทย์ได้เลย หลังเรียนจบ คะแนนพุ่งมาก' },
  { rating: 4, comment: 'สอนดีครับ แต่อยากให้เพิ่มโจทย์ฝึกหัดอีกหน่อย' },
  { rating: 4, comment: 'เนื้อหาดี ครูอธิบายชัดเจน ราคาคุ้มค่ามากๆ' },
  { rating: 5, comment: 'เรียนจบแล้วได้คะแนนสอบเพิ่มขึ้นเยอะมากค่ะ ขอบคุณครูมากๆ' },
  { rating: 3, comment: 'เนื้อหาพอใช้ได้ แต่อยากให้อัปเดตข้อสอบใหม่ๆ ด้วยครับ' },
  { rating: 5, comment: 'คุ้มค่ามากค่ะ สอนละเอียดและเข้าใจง่าย ครูใจดีมาก' },
  { rating: 4, comment: 'ดีครับ เนื้อหาครอบคลุม สไลด์สวย ตัวอย่างเยอะ' },
];

// ------------------------------------------------------------
// Banners
// ------------------------------------------------------------
const BANNERS = [
  {
    title: 'เปิดเทอมใหม่ ลด 30%!',
    subtitle: 'คอร์ส TCAS ทุกวิชา ราคาพิเศษ เฉพาะเดือนนี้เท่านั้น',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1920&auto=format&fit=crop',
    ctaLink: '/explore?category=tcas',
    ctaText: 'ดูคอร์ส TCAS',
    position: 'EXPLORE_TOP' as const,
    priority: 1,
  },
  {
    title: 'IELTS Band 7+ Guaranteed',
    subtitle: 'เรียนกับ Teacher Ann ผู้เชี่ยวชาญ IELTS ระดับประเทศ',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1920&auto=format&fit=crop',
    ctaLink: '/explore?category=ielts',
    ctaText: 'สมัครเรียน IELTS',
    position: 'EXPLORE_TOP' as const,
    priority: 2,
  },
  {
    title: 'คอร์ส SAT Math ใหม่!',
    subtitle: 'Digital SAT 2025 — เทคนิคใหม่ สำหรับข้อสอบรูปแบบใหม่',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1920&auto=format&fit=crop',
    ctaLink: '/explore?category=sat',
    ctaText: 'เริ่มเรียน SAT',
    position: 'EXPLORE_MIDDLE' as const,
    priority: 1,
  },
  {
    title: 'คณิตศาสตร์ ม.ปลาย ปูพื้นฐานให้แน่น',
    subtitle: 'เรียนกับพี่ป๊อป คณิตจะไม่ใช่เรื่องยากอีกต่อไป',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1920&auto=format&fit=crop',
    ctaLink: '/explore?category=high-school',
    ctaText: 'ดูคอร์ส ม.ปลาย',
    position: 'EXPLORE_MIDDLE' as const,
    priority: 2,
  },
];

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🧪 Mock Data Seed — สร้างข้อมูลจำลองสำหรับทดสอบ\n');

  // ตรวจสอบว่ามี courses ใน DB ก่อน
  const courseCount = await prisma.course.count({ where: { status: 'PUBLISHED' } });
  if (courseCount === 0) {
    console.error('❌ ไม่พบคอร์สใน database — กรุณารัน pnpm --filter @sigma/db db:seed ก่อน');
    process.exit(1);
  }

  // ----------------------------------------------------------
  // 1) Learner Users
  // ----------------------------------------------------------
  console.log('👩‍🎓 Creating Learner Users...');
  const learnerPassword = hashSync('password123', 10);
  const learnerIds: string[] = [];

  for (const learner of LEARNERS) {
    const user = await prisma.user.upsert({
      where: { email: learner.email },
      update: {
        name: learner.name,
        nickname: learner.nickname,
        phone: learner.phone,
        school: learner.school,
        province: learner.province,
        educationLevel: learner.educationLevel,
      },
      create: {
        email: learner.email,
        password: learnerPassword,
        name: learner.name,
        nickname: learner.nickname,
        phone: learner.phone,
        school: learner.school,
        province: learner.province,
        educationLevel: learner.educationLevel,
        role: 'USER',
      },
    });
    learnerIds.push(user.id);
    console.log(`   👤 ${learner.name} (${learner.email})`);
  }

  // ----------------------------------------------------------
  // 2) Chapters & Lessons
  // ----------------------------------------------------------
  console.log('\n📖 Creating Chapters & Lessons...');

  const allCourses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true },
  });

  let chaptersCreated = 0;
  let lessonsCreated = 0;

  for (const course of allCourses) {
    const existingChapters = await prisma.chapter.count({ where: { courseId: course.id } });
    if (existingChapters > 0) continue;

    for (let ci = 0; ci < CHAPTER_TEMPLATES.length; ci++) {
      const tpl = CHAPTER_TEMPLATES[ci];
      const chapter = await prisma.chapter.create({
        data: { title: tpl.title, order: ci + 1, courseId: course.id },
      });
      chaptersCreated++;

      for (let li = 0; li < tpl.lessons.length; li++) {
        const lesson = tpl.lessons[li];
        await prisma.lesson.create({
          data: {
            title: lesson.title,
            type: lesson.type as any,
            order: li + 1,
            duration: lesson.duration,
            chapterId: chapter.id,
            youtubeUrl: lesson.type === 'VIDEO' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
          },
        });
        lessonsCreated++;
      }
    }
  }
  console.log(`   ✅ ${chaptersCreated} chapters, ${lessonsCreated} lessons`);

  // ----------------------------------------------------------
  // 3) Payments & Enrollments
  // ----------------------------------------------------------
  console.log('\n💳 Creating Payments & Enrollments...');

  const enrollmentPlan = [
    { learnerIdx: 0, courseCount: 5 },  // สมชาย 5 คอร์ส
    { learnerIdx: 1, courseCount: 3 },  // สุดา 3 คอร์ส
    { learnerIdx: 2, courseCount: 4 },  // ณัฐ 4 คอร์ส
    { learnerIdx: 3, courseCount: 2 },  // พลอย 2 คอร์ส
    { learnerIdx: 4, courseCount: 6 },  // ต้อง 6 คอร์ส
  ];

  for (const plan of enrollmentPlan) {
    const userId = learnerIds[plan.learnerIdx];
    const courses = allCourses.slice(0, plan.courseCount);

    for (const course of courses) {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      if (existing) continue;

      const courseData = await prisma.course.findUnique({
        where: { id: course.id },
        select: { price: true, promotionalPrice: true },
      });
      const amount = courseData?.promotionalPrice || courseData?.price || 0;

      await prisma.payment.create({
        data: {
          userId,
          courseId: course.id,
          amount,
          status: 'COMPLETED',
          stripeId: `cs_mock_${userId.slice(0, 8)}_${course.id.slice(0, 8)}`,
        },
      });

      await prisma.enrollment.create({
        data: { userId, courseId: course.id, status: 'ACTIVE' },
      });
    }
    console.log(`   ✅ ${LEARNERS[plan.learnerIdx].name}: ${plan.courseCount} courses`);
  }

  // PENDING payment (ต้อง — กดซื้อแต่ยังไม่จ่าย)
  const pendingIdx = enrollmentPlan[4].courseCount;
  if (allCourses[pendingIdx]) {
    const exists = await prisma.payment.findFirst({
      where: { userId: learnerIds[4], courseId: allCourses[pendingIdx].id, status: 'PENDING' },
    });
    if (!exists) {
      await prisma.payment.create({
        data: {
          userId: learnerIds[4],
          courseId: allCourses[pendingIdx].id,
          amount: 3500,
          status: 'PENDING',
          stripeId: `cs_mock_pending_${learnerIds[4].slice(0, 8)}`,
        },
      });
      console.log(`   ⏳ ${LEARNERS[4].name}: 1 pending payment`);
    }
  }

  // FAILED payment (สมชาย — จ่ายเงินล้มเหลว)
  const failedIdx = enrollmentPlan[0].courseCount;
  if (allCourses[failedIdx]) {
    const exists = await prisma.payment.findFirst({
      where: { userId: learnerIds[0], courseId: allCourses[failedIdx].id, status: 'FAILED' },
    });
    if (!exists) {
      await prisma.payment.create({
        data: {
          userId: learnerIds[0],
          courseId: allCourses[failedIdx].id,
          amount: 2500,
          status: 'FAILED',
          stripeId: `cs_mock_failed_${learnerIds[0].slice(0, 8)}`,
        },
      });
      console.log(`   ❌ ${LEARNERS[0].name}: 1 failed payment`);
    }
  }

  // ----------------------------------------------------------
  // 4) Reviews
  // ----------------------------------------------------------
  console.log('\n⭐ Creating Reviews...');

  for (let li = 0; li < learnerIds.length; li++) {
    const userId = learnerIds[li];
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { courseId: true },
    });

    const toReview = enrollments.slice(0, Math.ceil(enrollments.length * 0.6));
    for (let ri = 0; ri < toReview.length; ri++) {
      const review = REVIEW_COMMENTS[(li + ri) % REVIEW_COMMENTS.length];
      const courseId = toReview[ri].courseId;

      const exists = await prisma.review.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (exists) continue;

      await prisma.review.create({
        data: {
          userId,
          courseId,
          rating: review.rating,
          comment: review.comment,
          helpful: Math.floor(Math.random() * 20),
        },
      });
    }
    console.log(`   ⭐ ${LEARNERS[li].name}: ${toReview.length} reviews`);
  }

  // ----------------------------------------------------------
  // 5) Banners
  // ----------------------------------------------------------
  console.log('\n🖼️  Creating Banners...');

  for (const banner of BANNERS) {
    const exists = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (exists) continue;
    await prisma.banner.create({ data: banner });
    console.log(`   🖼️  ${banner.title}`);
  }

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.chapter.count(),
    prisma.lesson.count(),
    prisma.enrollment.count(),
    prisma.payment.count(),
    prisma.review.count(),
    prisma.banner.count(),
  ]);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Mock data seeding complete!');
  console.log('='.repeat(50));
  console.log(`   👤 Users:        ${counts[0]}`);
  console.log(`   📚 Courses:      ${counts[1]}`);
  console.log(`   📖 Chapters:     ${counts[2]}`);
  console.log(`   🎬 Lessons:      ${counts[3]}`);
  console.log(`   📝 Enrollments:  ${counts[4]}`);
  console.log(`   💳 Payments:     ${counts[5]}`);
  console.log(`   ⭐ Reviews:      ${counts[6]}`);
  console.log(`   🖼️  Banners:     ${counts[7]}`);
  console.log('='.repeat(50));
  console.log('\n🔑 Test accounts (password: password123):');
  LEARNERS.forEach((l) => console.log(`   ${l.name}: ${l.email}`));
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Mock seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
