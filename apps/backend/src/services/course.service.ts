import { prisma } from '@sigma/db';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseStatusInput,
  CourseQueryInput,
  MarketplaceQueryInput,
} from '../schemas/course.schema.js';

export class CourseService {
  /**
   * Create a new course
   */
  async create(instructorId: string, input: CreateCourseInput) {
    // Generate slug from title if not present (simple version)
    const slug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    // Sanitize dates if they are strings
    const data = { ...input } as any;
    if (typeof data.enrollStartDate === 'string')
      data.enrollStartDate = new Date(data.enrollStartDate);
    if (typeof data.enrollEndDate === 'string') data.enrollEndDate = new Date(data.enrollEndDate);

    return prisma.course.create({
      data: {
        ...data,
        slug,
        instructorId,
      },
      include: { instructor: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Get a single course by ID
   */
  async findById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true, profileImage: true } },
        category: { select: { id: true, name: true, slug: true } },
        level: { select: { id: true, name: true, slug: true, order: true } },
        chapters: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        schedules: {
          orderBy: { date: 'asc' },
        },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Get a single course by slug
   */
  async findBySlug(slug: string) {
    const course = await prisma.course.findFirst({
      where: { slug },
      include: {
        instructor: { select: { id: true, name: true, email: true, profileImage: true } },
        category: { select: { id: true, name: true, slug: true } },
        level: { select: { id: true, name: true, slug: true, order: true } },
        chapters: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        schedules: {
          orderBy: { date: 'asc' },
        },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Get courses for Marketplace (Public View)
   * Optimized select & filtering
   */
  async getMarketplaceCourses(query: MarketplaceQueryInput) {
    const search = query.search;
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort = query.sort ?? 'newest';
    const categoryId = query.categoryId;
    const levelId = query.levelId;
    const tutorId = query.tutorId;
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;

    // Handle Category Hierarchy
    let categoryFilter: any = categoryId ? { categoryId } : {};

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });

      if (category && category.children.length > 0) {
        const childIds = category.children.map((c) => c.id);
        categoryFilter = { categoryId: { in: [categoryId, ...childIds] } };
      }
    }

    // Build Where Clause
    const where: any = {
      status: 'PUBLISHED', // Always filter published for marketplace
      published: true,     // ✅ บังคับให้ published เป็น true
      ...categoryFilter,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      }),
      ...(levelId && { levelId }),
      ...(tutorId && { instructorId: tutorId }),
      ...(minPrice !== undefined && !isNaN(minPrice) && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && !isNaN(maxPrice) && { price: { lte: maxPrice } }),
    };

    // 🌟 Resolve Conflict: Build Order Clause
    let orderBy: any = { createdAt: 'desc' };
    const sortParam = sort as string;
    if (sortParam === 'price-asc') orderBy = { price: 'asc' };
    else if (sortParam === 'price-desc') orderBy = { price: 'desc' };
    else if (sortParam === 'popular') orderBy = { enrollments: { _count: 'desc' } };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
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
          reviews: {
            select: { rating: true },
          },
          level: { select: { name: true } },
          category: { select: { name: true } },
          instructor: { select: { id: true, name: true, profileImage: true } },
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
      prisma.course.count({ where }),
    ]);

    // Transform and Calculate Rating
    const mappedCourses = courses.map((course) => {
      const reviewCount = course.reviews.length;
      const rating =
        reviewCount > 0
          ? course.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
          : 0;

      const { reviews, ...rest } = course;
      return {
        ...rest,
        rating,
        reviewCount,
      };
    });

    return {
      courses: mappedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get courses enrolled by a user (My Courses — enrolled endpoint)
   */
  async getUserEnrolledCourses(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            instructor: { select: { name: true } },
            _count: { select: { chapters: true } }, 
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get enrolled courses for the authenticated user (my-courses route).
   * Returns a simplified course list with enrollment status and progress.
   */
  async getMyCourses(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
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
      instructor: en.course.instructor?.name ?? 'ไม่ระบุผู้สอน',
      courseType: en.course.courseType,
      status: en.status,
      progress: en.status === 'COMPLETED' ? 100 : 0,
    }));
  }

  /**
   * Admin/Instructor Course List
   * 🌟 คงไว้: ระบบนับยอดรวมทั้งหมด (Summary)
   */
  async getAdminCourses(query: CourseQueryInput & { instructorId?: string }) {
    const { search, status, instructorId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = {
      ...(status && status !== 'all' && { status }),
      ...(instructorId && { instructorId }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const statsWhere = instructorId ? { instructorId } : {};

    const [courses, total, allCount, publishedCount, draftCount] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: { select: { name: true, email: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
      prisma.course.count({ where: statsWhere }),
      prisma.course.count({ where: { ...statsWhere, status: 'PUBLISHED' } }),
      prisma.course.count({ where: { ...statsWhere, status: 'DRAFT' } }),
    ]);

    return { 
      courses, 
      total, 
      totalPages: Math.ceil(total / limit),
      summary: {
        all: allCount,
        published: publishedCount,
        draft: draftCount
      }
    };
  }

  /**
   * Update a course
   */
  async update(id: string, input: UpdateCourseInput) {
    await this.findById(id); 

    return prisma.course.update({
      where: { id },
      data: input as any,
      include: { instructor: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Update course status (DRAFT → PUBLISHED → ARCHIVED)
   */
  async updateStatus(id: string, input: UpdateCourseStatusInput) {
    await this.findById(id);

    // ✅ อัปเดต boolean 'published' ให้ตรงกับ 'status'
    const isPublished = input.status === 'PUBLISHED';

    return prisma.course.update({
      where: { id },
      data: { 
        status: input.status,
        published: isPublished 
      },
    });
  }

  /**
   * Delete a course
   */
  async delete(id: string) {
    await this.findById(id);

    return prisma.course.delete({ where: { id } });
  }

  /**
   * Update thumbnail URL after upload
   */
  async updateThumbnail(id: string, thumbnailUrl: string) {
    return prisma.course.update({
      where: { id },
      data: { thumbnail: thumbnailUrl },
    });
  }
}

export const courseService = new CourseService();