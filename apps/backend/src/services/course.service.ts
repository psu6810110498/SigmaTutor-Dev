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

    // ✅ แก้ปัญหาติดชื่อแอดมิน: ถ้ามีการเลือกผู้สอน (instructorId) มา ให้ใช้คนนั้น
    // แต่ถ้าไม่มี (เช่น เป็นค่าว่าง) ให้ใช้ ID ของคนสร้าง (creatorId)
    const teacherId = (data.instructorId && data.instructorId !== "") ? data.instructorId : creatorId;
    delete data.instructorId;

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
          // provide minimal required defaults for schedule model
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(),
          status: 'ON_SCHEDULE',
        })),
      };
    }

    const course = await this.db.course.create({
      data: { ...data, slug, teacherId },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    const { teacher, teacherId: returnedTeacherId, ...rest } = course as any;
    return { ...rest, instructorId: returnedTeacherId, instructor: teacher };
  }

  /**
   * Get a single course by ID
   */
  async findById(id: string) {
    const course = await this.db.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true, profileImage: true } },
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
    
    // Map teacher back to instructor for the frontend
    const { teacher, teacherId, ...rest } = course as any;
    return { ...rest, instructorId: teacherId, instructor: teacher };
  }

  /**
   * Get a single course by slug
   */
  async findBySlug(slug: string) {
    const course = await this.db.course.findFirst({
      where: { slug },
      include: {
        teacher: { select: { id: true, name: true, email: true, profileImage: true } },
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
    
    // Map teacher back to instructor for the frontend
    const { teacher, teacherId, ...rest } = course as any;
    return { ...rest, instructorId: teacherId, instructor: teacher };
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
      ...(tutorId && { teacherId: tutorId }),
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
          description: true,
          thumbnail: true,
          price: true,
          originalPrice: true,
          promotionalPrice: true,
          courseType: true,
          reviews: { select: { rating: true } },
          level: { select: { name: true } },
          category: { select: { name: true } },
          teacher: { select: { id: true, name: true, profileImage: true } },
          teacherId: true,
          _count: { select: { enrollments: true } },
          videoCount: true,
          isBestSeller: true,
          isRecommended: true,
          tags: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.course.count({ where }),
    ]);

    const mappedCourses = courses.map((course) => {
      const reviewCount = course.reviews.length;
      const rating =
        reviewCount > 0
          ? course.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
          : 0;
      const { reviews, teacher, teacherId, ...rest } = course as any;
      return { ...rest, rating, reviewCount, instructor: teacher, instructorId: teacherId };
    });

    return {
      courses: mappedCourses,
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
      return {
        ...en,
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

    return this.db.course.update({
      where: { id },
      data: updateData,
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStatus(id: string, input: UpdateCourseStatusInput) {
    await this.findById(id);
    const isPublished = input.status === 'PUBLISHED';
    return this.db.course.update({
      where: { id },
      data: { status: input.status, published: isPublished },
    });
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