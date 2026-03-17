// ============================================================
// Seed — ข้อมูลจำลองสเกลใหญ่สำหรับโชว์ (Mock Courses)
// Run: pnpm --filter @sigma/db db:seed:mock
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, CourseType, VideoProvider, LessonType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to generate a random number between min and max (inclusive)
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample YouTube links for lessons (Working links provided by user)
const YOUTUBE_LINKS = [
  'https://www.youtube.com/watch?v=zizR670Xbzk',
  'https://youtu.be/1CjgSMX5k8o?si=P0XFlGMcBJSkBA-x',
  'https://youtu.be/cV-QdYtZnzc?si=MSnlCFqsAOKk3MBL',
  'https://youtu.be/-A9XZ63Z9_A?si=ExF3JaA26GmdeD7x',
  'https://youtu.be/fwRVCFvlMdI?si=DY-1Sjnc5LwEqsRk',
  'https://youtu.be/mY6H-P3l8Tg?si=iQ_ZS_27EsOm0RFv'
];

// Sample Thumbnails
const THUMBNAILS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop', // Math/Computer
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop', // Science/Chem
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop', // Writing/Notes
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1000&auto=format&fit=crop', // Physics/Abstract
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop', // Language/Study
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop', // Library
  'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1000&auto=format&fit=crop', // Numbers
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000&auto=format&fit=crop', // Biology/Nature
];

// Base titles for fast generation
const BASE_TITLES = [
  'ติวเข้มพิชิตข้อสอบ', 'สรุปเนื้อหารวบรัด', 'ตะลุยโจทย์ 1000 ข้อ',
  'ปูพื้นฐานสู่ความเข้าใจ', 'Hack เทคนิคทำข้อสอบ', 'เจาะลึกเนื้อหาฉบับสมบูรณ์',
  'เก็งข้อสอบลับ', 'คอร์สเรียนเร่งด่วน', 'เตรียมพร้อมก่อนลงสนาม', 'สรุปสูตรลับ'
];

async function main() {
  console.log('🚀 Starting Mock Data Generation...\n');

  console.log('🗑️  Deleting existing courses, chapters, lessons, schedules, enrollments...');
  const deletedCourses = await prisma.course.deleteMany({});
  console.log(`   ✅ Deleted ${deletedCourses.count} courses (cascading deletes applied)`);

  const deletedSchedules = await prisma.courseSchedule.deleteMany({});
  console.log(`   ✅ Deleted ${deletedSchedules.count} schedules`);

  const deletedEnrollments = await prisma.enrollment.deleteMany({});
  console.log(`   ✅ Deleted ${deletedEnrollments.count} enrollments`);

  // ── Phase 1: สร้าง Mock Teachers 15 ท่าน พร้อมข้อมูลครบถ้วน ──────────────────

  console.log('🔍 Fetching existing Categories...');
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
  });
  if (categories.length === 0) {
    console.error('❌ Error: No categories found. Please run db:seed first.');
    process.exit(1);
  }

  // ── Pool ข้อมูลครูจำลอง ──────────────────────────────────────────────────────

  const teacherFirstNames = ['สมชาย', 'ธวัชชัย', 'พีรพล', 'ณัฐวุฒิ', 'ศิริรัตน์', 'อารยา', 'มาริสา', 'ธนพล', 'ชัชวาล', 'วิภาดา', 'กิตติ', 'เอกราช', 'จิราพร', 'สุรชัย', 'พรทิพา'];
  const teacherLastNames  = ['ใจดี', 'รักเรียน', 'สอนดี', 'พาเพลิน', 'เก่งมาก', 'สุขสวัสดิ์', 'เจริญผล', 'รุ่งเรือง', 'ชัยชนะ', 'มั่นคง'];
  const teacherTitles     = ['PhD. ฟิสิกส์ จุฬาลงกรณ์มหาวิทยาลัย', 'ผู้เชี่ยวชาญคณิตศาสตร์โอลิมปิก', 'IELTS Examiner & ESL Specialist', 'M.Ed. วิทยาศาสตร์ศึกษา', 'Software Engineer & CS Tutor'];
  const teacherExpertise  = ['คณิตศาสตร์, ฟิสิกส์, TCAS', 'เคมี, ชีวะ, สอวน.', 'IELTS, TOEIC, ภาษาอังกฤษ', 'คณิตศาสตร์, สถิติ, GRE', 'ฟิสิกส์, วิทยาศาสตร์, PAT2'];

  // Pool ผลงานจริงสำหรับสุ่ม (แต่ละครูจะได้ 2-3 รายการ)
  const ACHIEVEMENTS_POOL = [
    'ตัวแทนประเทศไทย ฟิสิกส์โอลิมปิก ระดับนานาชาติ (IPhO)',
    'เหรียญทอง สอวน. คณิตศาสตร์ ค่าย 2',
    'ตัวแทนประเทศไทย คณิตศาสตร์โอลิมปิก (IMO)',
    'อาจารย์พิเศษ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย',
    'ผ่านการอบรม IELTS Examiner จาก British Council',
    'นักเรียนทุนรัฐบาลระดับปริญญาเอก ต่างประเทศ',
    'ประสบการณ์สอนกว่า 10 ปี ส่งนักเรียนติดหมอ/วิศวะ 200+ คน',
    'วิทยากรพิเศษ โครงการ สอวน. ค่าย 1 ภาคเหนือ',
    'เขียนหนังสือ "สูตรลัด TCAS คณิตศาสตร์" จำหน่ายกว่า 5,000 เล่ม',
    'อดีตแชมป์ระดับประเทศ การแข่งขันคณิตศาสตร์ POSN',
    'เหรียญเงิน เคมีโอลิมปิก (IChO)',
    'IELTS 9.0 — Band Score เต็ม', 
    'ปริญญาเอก สาขา Applied Mathematics, MIT',
  ];

  // Pool ประวัติการศึกษาสำหรับสุ่ม
  const EDUCATION_POOL = [
    'ปริญญาเอก วิศวกรรมศาสตร์ (Electrical Engineering) — จุฬาลงกรณ์มหาวิทยาลัย (2019)',
    'ปริญญาโท วิทยาศาสตร์คอมพิวเตอร์ — มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (2017)',
    'ปริญญาตรี คณิตศาสตร์ประยุกต์ — มหาวิทยาลัยมหิดล (2014)',
    'ผ่าน สอวน. ค่ายฟิสิกส์ ค่าย 2 — ศูนย์โรงเรียนเตรียมอุดมศึกษา (2012)',
    'ปริญญาตรี ครุศาสตร์ — จุฬาลงกรณ์มหาวิทยาลัย (เกียรตินิยมอันดับ 1)',
    'โรงเรียนมหิดลวิทยานุสรณ์ (MWIT) — สาขาวิทยาศาสตร์ (2009)',
    'ปริญญาตรี อักษรศาสตร์ ภาษาอังกฤษ — จุฬาลงกรณ์มหาวิทยาลัย',
    'ปริญญาโท TESOL — University of Melbourne, Australia',
    'ปริญญาโท  Applied Mathematics — Chalmers University of Technology, Sweden',
    'ทุนรัฐบาล ADB (Asian Development Bank) ระดับปริญญาโท (2016)',
  ];

  // Pool คำพูดคมคายของครู
  const QUOTES_POOL = [
    'เรียนให้เข้าใจหนึ่งครั้ง ดีกว่าท่องจำร้อยครั้ง',
    'โจทย์ทุกข้อมีคำตอบ ถ้าเรารู้จักวิธีถามมัน',
    'ความสำเร็จในห้องสอบเริ่มต้นจากการลงมือทำตั้งแต่วันนี้',
    'ไม่มีนักเรียนที่โง่ มีแต่ครูที่ยังหาวิธีสอนไม่เจอ',
    'ทุกปัญหาคณิตศาสตร์คือปริศนาที่รอให้คุณไขมัน',
    'เรียนภาษาอังกฤษคือการเปิดประตูสู่โลกใบใหม่',
    'ฉันเชื่อในตัวน้องมากกว่าที่น้องเชื่อในตัวเอง',
    'ข้อสอบ TCAS ไม่ได้วัดความฉลาด แต่วัดความเข้าใจ',
  ];

  // ── สร้างครู 15 ท่านพร้อมข้อมูลเต็มรูปแบบ ──────────────────────────────────

  console.log('🧑‍🏫 Generating 15 Mock Teachers with full profiles...');
  const mockTeachers = [];

  for (let t = 0; t < 15; t++) {
    const fName     = teacherFirstNames[t % teacherFirstNames.length];
    const lName     = teacherLastNames[randomInt(0, teacherLastNames.length - 1)];
    const title     = teacherTitles[t % teacherTitles.length];
    const expertise = teacherExpertise[t % teacherExpertise.length];
    const years     = randomInt(5, 20);

    // สุ่มผลงาน 2-3 รายการ
    const shuffledAch = [...ACHIEVEMENTS_POOL].sort(() => 0.5 - Math.random());
    const achievements = shuffledAch.slice(0, randomInt(2, 3));

    // สุ่มประวัติการศึกษา 2-3 รายการ
    const shuffledEdu = [...EDUCATION_POOL].sort(() => 0.5 - Math.random());
    const educationHistory = shuffledEdu.slice(0, randomInt(2, 3));

    const quote = QUOTES_POOL[t % QUOTES_POOL.length];
    const mockEmail = `mockteacher_${t}_${crypto.randomUUID().substring(0, 4)}@mock.sigma.com`;

    const newTeacher = await prisma.teacher.upsert({
      where: { email: mockEmail },
      update: {},
      create: {
        email:            mockEmail,
        name:             `ครู${fName} ${lName}`,
        nickname:         `ครูพี่${fName}`,
        title:            title,
        expertise:        expertise,
        experience:       `${years} ปี`,
        bio:              `ครู${fName} มีประสบการณ์สอนกว่า ${years} ปี เชี่ยวชาญในสาขา ${expertise} เน้นการสอนแบบเข้าใจ ลุยโจทย์จริง และติดตามผลรายบุคคล มีนักเรียนที่สอบติดคณะเป้าหมายแล้วกว่า 200+ คน`,
        quote:            quote,
        achievements:     achievements,
        educationHistory: educationHistory,
        profileImage:     `https://api.dicebear.com/7.x/avataaars/svg?seed=${fName}${t}&hair=short&clothing=blazerAndShirt`,
      },
    });
    mockTeachers.push(newTeacher);
  }
  console.log(`   ✅ 15 Mock Teachers created with full profiles.`);

  const allTeachers = mockTeachers;

  // 3. Generate 40 Courses
  const TARGET_COURSE_COUNT = 40;
  console.log(`\n📚 Generating ${TARGET_COURSE_COUNT} mock courses...`);

  let coursesCreated = 0;
  let chaptersCreated = 0;
  let lessonsCreated = 0;

  for (let i = 1; i <= TARGET_COURSE_COUNT; i++) {
    // Random Selection
    const category = categories[randomInt(0, categories.length - 1)];
    const teacher = allTeachers[randomInt(0, allTeachers.length - 1)];
    
    // Determine Course Type (70% ONLINE, 15% ONLINE_LIVE, 15% ONSITE)
    const typeRand = Math.random();
    let courseType: CourseType = 'ONLINE';
    if (typeRand > 0.85) courseType = 'ONLINE_LIVE';
    else if (typeRand > 0.70) courseType = 'ONSITE';

    const baseTitle = BASE_TITLES[randomInt(0, BASE_TITLES.length - 1)];
    const courseTitle = `${baseTitle} ${category.name} Vol.${randomInt(1, 9)}`;
    const slug = `mock-course-${crypto.randomUUID().substring(0, 8)}`;
    const originalPrice = randomInt(15, 60) * 100;
    const isPromo = Math.random() > 0.5;
    const promoPrice = isPromo ? Math.floor(originalPrice * 0.7) : null;
    const price = isPromo ? promoPrice! : originalPrice;
    
    const codeSuffix = crypto.randomUUID().substring(0, 4).toUpperCase();
    const courseCode = `${courseType === 'ONLINE' ? 'VOD' : courseType === 'ONLINE_LIVE' ? 'LIV' : 'ONS'}-${codeSuffix}`;

    // Generate rich HTML Description
    const richDescription = `
      <h3>ยินดีต้อนรับสู่คอร์ส ${courseTitle}</h3>
      <p>คอร์สจำลองนี้ถูกสร้างขึ้นแบบอัตโนมัติ สำหรับหมวดหมู่ <strong>${category.name}</strong> สอนโดยอาจารย์ผู้เชี่ยวชาญ <strong>${teacher.name}</strong> (${teacher.title})</p>
      <ul>
        <li>เนื้อหาครอบคลุมสำคัญทั้งหมด ${randomInt(30, 80)} ชั่วโมง</li>
        <li>มีแบบฝึกหัดและเอกสารให้ดาวน์โหลดฟรี</li>
        <li>การันตีความเข้าใจด้วยแบบทดสอบทุกสัปดาห์</li>
      </ul>
      <p><em>“เรียนสนุก เข้าใจง่าย ลุยข้อสอบได้จริง”</em> - รีวิวจากนักเรียนปีที่แล้ว</p>
      <hr />
      <h3>สิ่งที่คุณจะได้รับจากคอร์สนี้:</h3>
      <ol>
        <li>พื้นฐานที่แข็งแกร่งสำหรับการสอบ</li>
        <li>เทคนิคทำข้อสอบรวดเร็ว</li>
        <li>วิดีโอเนื้อหาอัปเดตใหม่ล่าสุดประจำปี 2026!</li>
      </ol>
    `;

    // Seat generation for LIVE and ONSITE
    const hasSeats = courseType !== 'ONLINE';
    const maxSeats = hasSeats ? randomInt(20, 100) : null;
    let enrolledMockCount = 0;
    
    // Simulate current enrolled students
    let isFullSeats = false;
    if (hasSeats) {
        // Either full, almost full, or empty
        const fillTrend = Math.random();
        if (fillTrend > 0.8) enrolledMockCount = maxSeats!; // FULL
        else if (fillTrend > 0.4) enrolledMockCount = randomInt(Math.floor(maxSeats! / 2), maxSeats! - 1);
        else enrolledMockCount = randomInt(0, 10);
    } else {
        enrolledMockCount = randomInt(5, 300); // Online has no limit, but we generate fake numbers
    }

    // Create the Course
    const course = await prisma.course.create({
      data: {
        title: courseTitle,
        slug: slug,
        courseCode: courseCode,
        description: richDescription,
        shortDescription: `คอร์ส ${courseTitle} ลุยโจทย์และปูพื้นฐาน ${category.name}`,
        price: price,
        originalPrice: originalPrice,
        promotionalPrice: promoPrice,
        courseType: courseType,
        maxSeats: maxSeats,
        thumbnail: THUMBNAILS[randomInt(0, THUMBNAILS.length - 1)],
        teacherId: teacher.id,
        categoryId: category.id,
        status: 'PUBLISHED',
        published: true,
        isBestSeller: Math.random() > 0.8,
        duration: `${randomInt(10, 50)} ชม.`,
        videoCount: 0, // Will update later
      }
    });
    coursesCreated++;

    // Create Chapters (3 - 6 per course)
    const numChapters = randomInt(3, 6);
    let totalLessonsCount = 0;

    for (let c = 1; c <= numChapters; c++) {
      const chapter = await prisma.chapter.create({
        data: {
          title: `บทที่ ${c}: ${baseTitle} ส่วนที่ ${c}`,
          order: c,
          courseId: course.id,
        }
      });
      chaptersCreated++;

      // Create Lessons (2 - 5 per chapter)
      const numLessons = randomInt(2, 5);
      for (let l = 1; l <= numLessons; l++) {
        // Randomly make one lesson a File type (PDF)
        const isFile = Math.random() < 0.2; 
        const type: LessonType = isFile ? 'FILE' : 'VIDEO';

        await prisma.lesson.create({
          data: {
            title: isFile ? `เอกสารประกอบการเรียน บทที่ ${c}.${l}` : `เนื้อหาวิดีโอตอนที่ ${c}.${l}`,
            type: type,
            youtubeUrl: isFile ? null : YOUTUBE_LINKS[randomInt(0, YOUTUBE_LINKS.length - 1)],
            videoProvider: 'YOUTUBE',
            duration: isFile ? null : randomInt(5, 45), // in minutes
            order: l,
            chapterId: chapter.id,
            isFree: c === 1 && l === 1, // First lesson is free
            materialUrl: isFile ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : null,
          }
        });
        lessonsCreated++;
        totalLessonsCount++;
      }
    }

    // Update Course Video Count
    await prisma.course.update({
      where: { id: course.id },
      data: { videoCount: totalLessonsCount }
    });

    // We need to create some mock users if we want them to be enrolled, 
    // but doing so 40 * 100 times is heavy.
    // Instead, we will simulate the enrollments if `seats` tracking depends on it.
    // Let's create a single 'Dummy User' array to attach enrollments to.
    // But since `userId` requires an actual User record, we'll create some beforehand.
    // (We will handle this outside the loop next)

    // Generate Schedules for Live/Onsite courses
    if (courseType !== 'ONLINE') {
        const numSessions = randomInt(4, 8);
        let startDate = new Date();
        startDate.setDate(startDate.getDate() + randomInt(1, 14)); // Start in 1-14 days
        
        for (let s = 1; s <= numSessions; s++) {
            const sessionDate = new Date(startDate);
            sessionDate.setDate(sessionDate.getDate() + (s - 1) * 7); // Once a week
            
            // Starts at 10 AM, ends at 12 PM
            const sessionStartTime = new Date(sessionDate);
            sessionStartTime.setHours(10, 0, 0);
            const sessionEndTime = new Date(sessionDate);
            sessionEndTime.setHours(12, 0, 0);

            await prisma.courseSchedule.create({
                data: {
                    courseId: course.id,
                    sessionNumber: s,
                    topic: `การเรียนรู้แบบสด ครั้งที่ ${s}`,
                    date: sessionDate,
                    startTime: sessionStartTime,
                    endTime: sessionEndTime,
                    isOnline: courseType === 'ONLINE_LIVE',
                    zoomLink: courseType === 'ONLINE_LIVE' ? 'https://zoom.us/j/1234567890' : null,
                    location: courseType === 'ONSITE' ? 'สาขาสยามสแควร์ ห้อง 401' : null,
                    status: 'ON_SCHEDULE',
                }
            });
        }
    }

    // Progress logging every 10 courses
    if (i % 10 === 0) {
      console.log(`   ...Generated ${i}/${TARGET_COURSE_COUNT} courses.`);
    }
  }

  // Generate Mock Students for Enrollments to display seat filling accurately
  console.log('\n👨‍🎓 Generating mock enrollments to fill seats...');
  const mockUsers = [];
  for (let u = 0; u < 50; u++) {
    const mockEmail = `mockstudent_${crypto.randomUUID().substring(0, 5)}@mock.com`;
    const user = await prisma.user.upsert({
      where: { email: mockEmail },
      update: {},
      create: {
        email: mockEmail,
        password: 'mockpassword', // Note: in real scenarios use bcrypt
        name: `นักเรียนจำลอง ${u+1}`,
        role: 'USER',
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=mockuser${u}&hair=short&clothing=blazerAndShirt`
      }
    });
    mockUsers.push(user);
  }

  // Fill up enrollments for courses
  const allGeneratedCourses = await prisma.course.findMany({ select: { id: true, maxSeats: true, courseType: true } });
  let totalEnrollments = 0;

  // We chunk the array so we don't spam the DB
  for (const c of allGeneratedCourses) {
    let mockEnrolls = 0;
    
    // Assign mock enroll count based on type
    if (c.courseType !== 'ONLINE') {
        const fillTrend = Math.random();
        if (fillTrend > 0.8) mockEnrolls = c.maxSeats!; // FULL
        else if (fillTrend > 0.4) mockEnrolls = randomInt(Math.floor(c.maxSeats! / 2), c.maxSeats! - 1);
        else mockEnrolls = randomInt(1, 10);
    } else {
        mockEnrolls = randomInt(5, 45); // Limit to mock users pool
    }

    if (mockEnrolls > mockUsers.length) mockEnrolls = mockUsers.length;

    // Shuffle and pick
    const shuffledUsers = mockUsers.sort(() => 0.5 - Math.random());
    const pickedUsers = shuffledUsers.slice(0, mockEnrolls);

    const enrollmentData = pickedUsers.map(user => ({
        userId: user.id,
        courseId: c.id,
        status: 'ACTIVE' as const
    }));

    if (enrollmentData.length > 0) {
        const createdEnrollments = await prisma.enrollment.createMany({
            data: enrollmentData,
            skipDuplicates: true
        });
        totalEnrollments += createdEnrollments.count;

        // Generate Reviews (50% to 80% of enrolled students will leave a review)
        const numReviews = Math.floor(pickedUsers.length * (Math.random() * 0.3 + 0.5));
        if (numReviews > 0) {
            const reviewers = pickedUsers.slice(0, numReviews);
            const reviewComments = [
                'สอนเข้าใจง่ายมากครับ ได้เทคนิคไปเยอะเลย',
                'เนื้อหาดีมาก ภาพเสียงคมชัด',
                'คุ้มค่ากับราคามากๆ แนะนำเลยครับ',
                'ช่วยให้ทำข้อสอบได้เร็วขึ้นจริง',
                'ชอบการสอนของคุณครูมากๆ เข้าใจง่าย ไม่น่าเบื่อ',
                'จัดเรียบเรียงเนื้อหาได้ดีมากครับ',
                'ตรงจุด มีประโยชน์กับการสอบมาก',
                'อธิบายละเอียดแบบคนไม่มีพื้นฐานก็เข้าใจได้'
            ];
            const reviewData = reviewers.map(user => {
                const isGreat = Math.random() > 0.2; // 80% true
                return {
                    userId: user.id,
                    courseId: c.id,
                    rating: isGreat ? 5 : 4,
                    comment: reviewComments[randomInt(0, reviewComments.length - 1)],
                    helpful: randomInt(0, 50)
                };
            });
            await prisma.review.createMany({
                data: reviewData,
                skipDuplicates: true
            });
        }
    }
  }
  console.log(`   ✅ Seeded ${totalEnrollments} mock enrollments for seat calculation`);
  console.log(`   ✅ Seeded mock reviews for courses`);

  console.log('\n🎉 Mock Data Generation Complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Courses:  ${coursesCreated}`);
  console.log(`   - Chapters: ${chaptersCreated}`);
  console.log(`   - Lessons:  ${lessonsCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Mock Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
