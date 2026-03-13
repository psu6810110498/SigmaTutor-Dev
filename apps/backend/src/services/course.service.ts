import { prisma } from '@sigma/db';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseStatusInput,
  CourseQueryInput,
  MarketplaceQueryInput,
} from '../schemas/course.schema.js';
import type { CourseAvailability } from '../schemas/seat-availability.schema.js';
import { seatReservationService } from './seat-reservation.service.js';

// Use Prisma's own type from our DB package (avoids @prisma/client direct import)
type DbClient = typeof prisma;

// ── Prisma select fragments ──────────────────────────────────────────────────

/** Select fragment สำหรับดึงข้อมูลผู้สอนใน join table (ใช้ซ้ำทุก query) */
const TEACHERS_SELECT = {
  select: {
    role: true,
    order: true,
    teacher: { select: { id: true, name: true, profileImage: true } },
  },
  orderBy: { order: 'asc' as const },
};

// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * แปลง course record จาก Prisma → รูปแบบที่ frontend ต้องการ
 * - teacher/teacherId → instructor/instructorId (backward compat)
 * - teachers (join table) → instructors[] (รายชื่อผู้สอนทั้งหมด)
 */
function mapCourseToApiShape(course: any) {
  const { teacher, teacherId, teachers, reviews, ...rest } = course;

  // คำนวณ rating จาก reviews (ถ้ามีอยู่ใน record)
  let ratingFields = {};
  if (Array.isArray(reviews)) {
    const reviewCount = reviews.length;
    const rating =
      reviewCount > 0
        ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount
        : 0;
    ratingFields = { rating, reviewCount };
  }

  // แปลง join table records → array ของ instructor objects
  const instructors = Array.isArray(teachers)
    ? teachers.map((ct: any) => ({ ...ct.teacher, role: ct.role, order: ct.order }))
    : [];

  return {
    ...rest,
    ...ratingFields,
    instructorId: teacherId ?? null,
    instructor: teacher ?? null,
    instructors,
  };
}

export class CourseService {
  /**
   * Dependency Injection: Accept database via constructor.
   */
  constructor(private db: DbClient = prisma) { }

  /**
   * Create a new course
   */
  async create(creatorId: string, input: CreateCourseInput) {
    const slug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    const data = { ...input } as any;

    // ✅ จัดการเรื่องวันที่
    if (typeof data.enrollStartDate === 'string')
      data.enrollStartDate = new Date(data.enrollStartDate);
    if (typeof data.enrollEndDate === 'string') data.enrollEndDate = new Date(data.enrollEndDate);

    // ✅ ตรวจสอบ IDs ว่าเป็น string ที่ไม่ว่าง (cuid) ป้องกัน Foreign Key Error
    if (data.levelId === '' || data.levelId === undefined) data.levelId = null;
    if (data.categoryId === '' || data.categoryId === undefined) data.categoryId = null;

    // ✅ ตรวจสอบ categoryId และ levelId ว่ามีอยู่ใน DB จริง (ป้องกัน stale draft / invalid ID)
    if (data.categoryId) {
      const cat = await this.db.category.findUnique({ where: { id: data.categoryId } });
      if (!cat) {
        throw new Error('หมวดหมู่ที่เลือกไม่ถูกต้อง กรุณาเลือกหมวดหมู่ใหม่อีกครั้ง (อาจเกิดจากข้อมูลเก่าในแบบร่าง)');
      }
    }
    if (data.levelId) {
      const lvl = await this.db.level.findUnique({ where: { id: data.levelId } });
      if (!lvl) {
        throw new Error('ระดับชั้นที่เลือกไม่ถูกต้อง กรุณาเลือกระดับชั้นใหม่อีกครั้ง');
      }
    }

    // ── กำหนด teacherId (ผู้สอนหลัก) ──────────────────────────────────────────
    // ถ้ามี instructorIds[] ให้ใช้ตัวแรกเป็น LEAD, ถ้าไม่มีให้ fallback ไปที่ instructorId หรือ creatorId
    const instructorIds: string[] = Array.isArray(data.instructorIds) && data.instructorIds.length > 0
      ? data.instructorIds
      : [];
    const primaryInstructorId = instructorIds[0] ?? data.instructorId ?? creatorId;
    const teacherId = (primaryInstructorId && primaryInstructorId !== "") ? primaryInstructorId : creatorId;
    delete data.instructorId;
    delete data.instructorIds;

    // If frontend sent a flat schedules array, convert it to Prisma nested create format
    if (Array.isArray(data.schedules)) {
      const sessions = data.schedules as any[];
      data.schedules = {
        create: sessions.map((s, idx) => ({
          sessionNumber: s.sessionNumber ?? (idx + 1),
          topic: s.title ?? s.topic ?? 'ไม่มีหัวข้อ',
          chapterTitle: s.chapterTitle ?? null,
          videoUrl: s.videoUrl ?? null,
          gumletVideoId: s.gumletVideoId ?? null,
          videoProvider: s.videoProvider ?? 'YOUTUBE',
          materialUrl: s.materialUrl ?? null,
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(),
          status: 'ON_SCHEDULE',
        })),
      };
    }

    // สร้างคอร์สก่อน แล้วค่อย upsert CourseTeacher records ใน transaction เดียวกัน
    const course = await this.db.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: { ...data, slug, teacherId },
        include: {
          teacher: { select: { id: true, name: true, email: true, profileImage: true } },
          teachers: TEACHERS_SELECT,
        },
      });

      // สร้าง CourseTeacher records ถ้ามี instructorIds ส่งมา
      if (instructorIds.length > 0) {
        await tx.courseTeacher.createMany({
          data: instructorIds.map((tid, idx) => ({
            courseId: created.id,
            teacherId: tid,
            role: idx === 0 ? 'LEAD' : 'ASSISTANT',
            order: idx,
          })),
          skipDuplicates: true,
        });
      }

      // ดึงข้อมูลใหม่พร้อม teachers ที่เพิ่งสร้าง
      return tx.course.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          teacher: { select: { id: true, name: true, email: true, profileImage: true } },
          teachers: TEACHERS_SELECT,
        },
      });
    });

    // ✅ Init Redis counter สำหรับคอร์สใหม่ที่มีจำกัดที่นั่ง (ONSITE/LIVE)
    if (course.courseType !== 'ONLINE' && course.maxSeats != null && course.maxSeats > 0) {
      await seatReservationService.syncCounter(course.id, course.maxSeats, 0, 0);
    }

    return mapCourseToApiShape(course);
  }

  /**
   * Get a single course by ID
   */
  async findById(id: string) {
    const course = await this.db.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true, profileImage: true } },
        teachers: TEACHERS_SELECT,
        category: { select: { id: true, name: true, slug: true } },
        level: { select: { id: true, name: true, slug: true, order: true } },
        chapters: {
          include: { lessons: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        schedules: { orderBy: { sessionNumber: 'asc' } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) throw new Error('Course not found');
    return mapCourseToApiShape(course);
  }

  /**
   * Get a single course by slug
   */
  async findBySlug(slug: string) {
    const course = await this.db.course.findFirst({
      where: { slug },
      include: {
        teacher: { select: { id: true, name: true, email: true, profileImage: true } },
        teachers: TEACHERS_SELECT,
        category: { select: { id: true, name: true, slug: true } },
        level: { select: { id: true, name: true, slug: true, order: true } },
        chapters: {
          include: { lessons: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        schedules: { orderBy: { date: 'asc' } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) throw new Error('Course not found');
    return mapCourseToApiShape(course);
  }

  /**
   * Get courses for Marketplace (Public View)
   */
  async getMarketplaceCourses(query: MarketplaceQueryInput) {
    const search = query.search;
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort = query.sort ?? 'newest';
    const categoryId = query.categoryId;
    const levelId = query.levelId;
    const tutorId = query.tutorId || query.instructorId;
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;

    let categoryFilter: any = categoryId ? { categoryId } : {};

    if (categoryId) {
      const category = await this.db.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });

      if (category && category.children.length > 0) {
        const childIds = category.children.map((c) => c.id);
        categoryFilter = { categoryId: { in: [categoryId, ...childIds] } };
      }
    }

    const where: any = {
      status: 'PUBLISHED',
      published: true,
      ...categoryFilter,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      }),
      ...(levelId && { levelId }),
      // tutorId — ค้นหาทั้งจาก teacherId (legacy) และ teachers join table (multi-instructor)
      ...(tutorId && {
        OR: [
          { teacherId: tutorId },
          { teachers: { some: { teacherId: tutorId } } },
        ],
      }),
      ...(minPrice !== undefined && !isNaN(minPrice) && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && !isNaN(maxPrice) && { price: { lte: maxPrice } }),
    };

    let orderBy: any = { createdAt: 'desc' };
    const sortParam = sort as string;
    if (sortParam === 'price-asc') orderBy = { price: 'asc' };
    else if (sortParam === 'price-desc') orderBy = { price: 'desc' };
    else if (sortParam === 'popular') orderBy = { enrollments: { _count: 'desc' } };

    const [courses, total] = await Promise.all([
      this.db.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          description: true,
          thumbnail: true,
          price: true,
          originalPrice: true,
          promotionalPrice: true,
          courseType: true,
          // ข้อมูลสำหรับแสดง info chips บน Card
          duration: true,
          videoCount: true,
          maxSeats: true,
          enrollStartDate: true,
          isBestSeller: true,
          isRecommended: true,
          createdAt: true,
          tags: true,
          reviews: { select: { rating: true } },
          level: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true, profileImage: true } },
          teachers: TEACHERS_SELECT,
          teacherId: true,
          // enrollments count สำหรับ Progress Bar บน Card (ไม่ต้อง fetch แยก)
          _count: { select: { enrollments: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.course.count({ where }),
    ]);

    const mappedCourses = courses.map((course) => mapCourseToApiShape(course));

    // กรองคอร์สที่เต็มออก (สำหรับหน้าแรก) — post-filter เพื่อหลีกเลี่ยง subquery ที่ซับซ้อน
    // ใช้เมื่อ excludeFull=true (landing page) เท่านั้น
    const filteredCourses = query.excludeFull
      ? mappedCourses.filter((c: any) => {
          const isLimited = c.courseType === 'ONSITE' || c.courseType === 'ONLINE_LIVE';
          if (!isLimited || c.maxSeats == null) return true; // ONLINE courses are never full
          const enrolled = c._count?.enrollments ?? 0;
          return enrolled < c.maxSeats; // hide if full
        })
      : mappedCourses;

    return {
      courses: filteredCourses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserEnrolledCourses(userId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            teacher: { select: { name: true } },
            teacherId: true,
            _count: { select: { chapters: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map teacher → instructor for frontend compatibility
    return enrollments.map((en: any) => {
      const { teacher, teacherId, ...courseRest } = en.course;
      const isExpired = en.expiresAt ? new Date(en.expiresAt) < new Date() : false;
      return {
        ...en,
        isExpired,
        course: { ...courseRest, instructor: teacher, instructorId: teacherId }
      };
    });
  }

  async getMyCourses(userId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            teacher: { select: { name: true } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((en) => ({
      id: en.course.id,
      title: en.course.title,
      thumbnail: en.course.thumbnail,
      categoryName: en.course.category?.name ?? 'ทั่วไป',
      instructor: (en.course as any).teacher?.name ?? 'ไม่ระบุผู้สอน',
      courseType: en.course.courseType,
      status: en.status,
      progress: en.status === 'COMPLETED' ? 100 : 0,
    }));
  }

  async getAdminCourses(query: CourseQueryInput & { instructorId?: string }) {
    const { search, status, instructorId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = {
      ...(status && status !== ('all' as any) && { status }),
      ...(instructorId && { teacherId: instructorId }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    };

    const statsWhere = instructorId ? { teacherId: instructorId } : {};

    const [courses, total, allCount, publishedCount, draftCount] = await Promise.all([
      this.db.course.findMany({
        where,
        include: {
          teacher: { select: { name: true, email: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.course.count({ where }),
      this.db.course.count({ where: statsWhere }),
      this.db.course.count({ where: { ...statsWhere, status: 'PUBLISHED' } }),
      this.db.course.count({ where: { ...statsWhere, status: 'DRAFT' } }),
    ]);

    // Map output
    const mappedCourses = courses.map((course: any) => {
      const { teacher, teacherId, ...rest } = course;
      return { ...rest, instructorId: teacherId, instructor: teacher };
    });

    return {
      courses: mappedCourses,
      total,
      totalPages: Math.ceil(total / limit),
      summary: { all: allCount, published: publishedCount, draft: draftCount },
    };
  }

  async update(id: string, input: UpdateCourseInput) {
    await this.findById(id);

    const updateData: any = { ...input };

    // ── แยก instructorIds ออกก่อน (ไม่ใช่ field บน Course model) ──────────────
    const instructorIds: string[] | null = Array.isArray(updateData.instructorIds)
      ? updateData.instructorIds
      : null;
    delete updateData.instructorIds;

    // ✅ ปรับแก้ข้อมูล IDs ให้ถูกต้องก่อนอัปเดต (string cuid หรือ null)
    if (updateData.levelId === '' || updateData.levelId === undefined) updateData.levelId = null;
    if (updateData.categoryId === '' || updateData.categoryId === undefined) updateData.categoryId = null;
    if ('instructorId' in updateData) {
      updateData.teacherId = updateData.instructorId === '' ? null : updateData.instructorId;
      delete updateData.instructorId;
    }

    // ✅ ตรวจสอบ categoryId และ levelId ว่ามีอยู่ใน DB จริง
    if (updateData.categoryId) {
      const cat = await this.db.category.findUnique({ where: { id: updateData.categoryId } });
      if (!cat) throw new Error('หมวดหมู่ที่เลือกไม่ถูกต้อง กรุณาเลือกหมวดหมู่ใหม่อีกครั้ง');
    }
    if (updateData.levelId) {
      const lvl = await this.db.level.findUnique({ where: { id: updateData.levelId } });
      if (!lvl) throw new Error('ระดับชั้นที่เลือกไม่ถูกต้อง กรุณาเลือกระดับชั้นใหม่อีกครั้ง');
    }

    const course = await this.db.$transaction(async (tx) => {
      // อัพเดท Course fields ปกติ
      await tx.course.update({ where: { id }, data: updateData });

      // ถ้ามี instructorIds ส่งมา → แทนที่รายชื่อผู้สอนทั้งหมด (replace strategy)
      if (instructorIds !== null) {
        await tx.courseTeacher.deleteMany({ where: { courseId: id } });
        if (instructorIds.length > 0) {
          // teacherId บน Course ต้องตรงกับผู้สอน LEAD คนแรก
          const leadId = instructorIds[0];
          await tx.course.update({ where: { id }, data: { teacherId: leadId } });
          await tx.courseTeacher.createMany({
            data: instructorIds.map((tid, idx) => ({
              courseId: id,
              teacherId: tid,
              role: idx === 0 ? 'LEAD' : 'ASSISTANT',
              order: idx,
            })),
          });
        }
      }

      return tx.course.findUniqueOrThrow({
        where: { id },
        include: {
          teacher: { select: { id: true, name: true, email: true, profileImage: true } },
          teachers: TEACHERS_SELECT,
        },
      });
    });

    // ✅ Re-sync Redis counter ถ้ามีการแก้ไข maxSeats หรือ courseType
    if (course.courseType !== 'ONLINE' && course.maxSeats != null && course.maxSeats > 0) {
      const enrolledCount = await this.db.enrollment.count({
        where: { courseId: id, status: 'ACTIVE' },
      });
      const reservedCount = await seatReservationService.countReservations(id);
      await seatReservationService.syncCounter(id, course.maxSeats, enrolledCount, reservedCount);
    }

    return course;
  }

  async updateStatus(id: string, input: UpdateCourseStatusInput) {
    const course = await this.db.course.findUnique({
      where: { id },
      select: { courseType: true, maxSeats: true },
    });
    if (!course) throw new Error('Course not found');

    const isPublished = input.status === 'PUBLISHED';

    const updated = await this.db.course.update({
      where: { id },
      data: { status: input.status, published: isPublished },
    });

    // เมื่อ publish คอร์สที่มีจำกัดที่นั่ง → init Redis counter ทันที
    // ป้องกัน false FULL เมื่อ user พยายามซื้อก่อนที่ counter จะถูก init
    const isLimited =
      isPublished &&
      course.courseType !== 'ONLINE' &&
      course.maxSeats != null &&
      course.maxSeats > 0;

    if (isLimited) {
      const enrolledCount = await this.db.enrollment.count({
        where: { courseId: id, status: 'ACTIVE' },
      });
      await seatReservationService.syncCounter(
        id,
        course.maxSeats!,
        enrolledCount,
        0, // ยังไม่มี active reservation ตอน publish
      );
    }

    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    return this.db.course.delete({ where: { id } });
  }

  async updateThumbnail(id: string, thumbnailUrl: string) {
    return this.db.course.update({
      where: { id },
      data: { thumbnail: thumbnailUrl },
    });
  }

  /**
   * Get real-time seat availability for a course.
   * ONLINE courses are always unlimited.
   * ONLINE_LIVE / ONSITE courses are limited by maxSeats.
   */
  async getAvailability(courseId: string): Promise<CourseAvailability> {
    const course = await this.db.course.findUnique({
      where: { id: courseId },
      select: { id: true, courseType: true, maxSeats: true },
    });

    if (!course) throw new Error('Course not found');

    if (course.courseType === 'ONLINE') {
      return {
        courseId,
        courseType: 'ONLINE',
        isLimited: false,
        maxSeats: null,
        enrolledCount: 0,
        reservedCount: 0,
        remaining: null,
        isFull: false,
        isReservedOnly: false,
        percentage: null,
        earliestExpiryInSeconds: null,
      };
    }

    const maxSeats = course.maxSeats ?? 0;

    const enrolledCount = await this.db.enrollment.count({
      where: { courseId, status: 'ACTIVE' },
    });

    let availableFromRedis = await seatReservationService.getAvailableCount(courseId);

    if (availableFromRedis === null) {
      const reservedCount = await seatReservationService.countReservations(courseId);
      await seatReservationService.syncCounter(courseId, maxSeats, enrolledCount, reservedCount);
      availableFromRedis = Math.max(0, maxSeats - enrolledCount - reservedCount);
    }

    const reservedCount = await seatReservationService.countReservations(courseId);
    const takenCount = enrolledCount + reservedCount;
    const remaining = Math.max(0, maxSeats - takenCount);
    const isFull = remaining <= 0;
    const isReservedOnly = isFull && enrolledCount < maxSeats;
    const percentage = maxSeats > 0 ? Math.round((takenCount / maxSeats) * 100) : 100;
    const earliestExpiryInSeconds = isReservedOnly
      ? await seatReservationService.getEarliestExpiry(courseId)
      : null;

    return {
      courseId,
      courseType: course.courseType as 'ONLINE_LIVE' | 'ONSITE',
      isLimited: true,
      maxSeats,
      enrolledCount,
      reservedCount,
      remaining,
      isFull,
      isReservedOnly,
      percentage,
      earliestExpiryInSeconds,
    };
  }
}

export const courseService = new CourseService();