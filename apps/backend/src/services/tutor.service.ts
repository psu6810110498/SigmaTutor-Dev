import { prisma } from '@sigma/db';
import type { TutorQueryInput } from '../schemas/course.schema.js';

export class TutorService {
  /**
   * Returns instructors who have at least one PUBLISHED course
   * matching all provided filter params.
   * Used by TutorHighlight to stay in sync with the active marketplace filters.
   */
  async getFiltered(query: TutorQueryInput) {
    const { categoryId, levelId, courseType, minPrice, maxPrice, search } = query;

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

    const courseWhere: Record<string, unknown> = {
      status: 'PUBLISHED',
      published: true,
      ...categoryFilter,
      ...(levelId && { levelId }),
      ...(courseType && { courseType }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return prisma.teacher.findMany({
      where: { courses: { some: courseWhere } },
      select: { id: true, name: true, nickname: true, profileImage: true, title: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Returns all instructors who have at least one PUBLISHED course
   * with expanded fields for the public tutor listing page.
   */
  async getAll() {
    const tutors = await prisma.teacher.findMany({
      where: { courses: { some: { status: 'PUBLISHED', published: true } } },
      select: {
        id: true,
        name: true,
        nickname: true,
        profileImage: true,
        title: true,
        bio: true,
        expertise: true,
        experience: true,
        education: true,
        socialLink: true,
        _count: {
          select: { courses: { where: { status: 'PUBLISHED', published: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Attach aggregate review stats + new profile fields (graceful — migration may not have run)
    const tutorsWithStats = await Promise.all(
      tutors.map(async (tutor) => {
        const [stats, richFields] = await Promise.all([
          this._getReviewStats(tutor.id),
          this._getRichFields(tutor.id),
        ]);
        return { ...tutor, ...stats, ...richFields };
      })
    );

    return tutorsWithStats;
  }

  /**
   * Returns the full profile of a single instructor including:
   * - published courses (with rating/enrollment counts)
   * - aggregated review stats across all courses
   * - 6 most recent reviews
   */
  async getById(id: string) {
    const tutor = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nickname: true,
        profileImage: true,
        title: true,
        bio: true,
        expertise: true,
        experience: true,
        education: true,
        socialLink: true,
        courses: {
          where: { status: 'PUBLISHED', published: true },
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            thumbnail: true,
            price: true,
            promotionalPrice: true,
            courseType: true,
            createdAt: true,
            isBestSeller: true,
            isRecommended: true,
            duration: true,
            videoCount: true,
            maxSeats: true,
            enrollStartDate: true,
            category: { select: { id: true, name: true } },
            level: { select: { id: true, name: true } },
            _count: { select: { enrollments: true, reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tutor) return null;

    const [reviewStats, recentReviews, richFields] = await Promise.all([
      this._getReviewStats(id),
      this._getRecentReviews(id),
      this._getRichFields(id),
    ]);

    // นับจำนวนนักเรียน — graceful fallback เป็น 0 ถ้า Schema ไม่พร้อม
    let totalStudents = 0;
    try {
      totalStudents = await prisma.enrollment.count({
        where: {
          status: 'ACTIVE',
          course: {
            OR: [
              { teacherId: id },
              { teachers: { some: { teacherId: id } } },
            ],
          },
        },
      });
    } catch {
      totalStudents = 0;
    }

    return {
      ...tutor,
      ...richFields,
      ...reviewStats,
      recentReviews,
      totalStudents,
    };
  }


  /** Fetch new rich profile fields — graceful fallback if migration hasn't run yet */
  private async _getRichFields(tutorId: string): Promise<Record<string, unknown>> {
    try {
      const t = await prisma.teacher.findUnique({
        where: { id: tutorId },
        select: {
          educationHistory: true,
          achievements: true,
          quote: true,
          facebookUrl: true,
          instagramUrl: true,
          tiktokUrl: true,
          linkedinUrl: true,
        },
      });
      return t ?? {};
    } catch {
      // Migration not yet applied — return safe defaults
      return {
        educationHistory: [],
        achievements: [],
        quote: null,
        facebookUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        linkedinUrl: null,
      };
    }
  }

  /** Aggregate review stats สำหรับครูคนนี้ — graceful fallback ถ้า query ล้มเหลว */
  private async _getReviewStats(tutorId: string) {
    try {
      const courseFilter = {
        course: {
          OR: [
            { teacherId: tutorId },
            { teachers: { some: { teacherId: tutorId } } },
          ],
        },
      } as const;

      const [aggregate, distribution] = await Promise.all([
        prisma.review.aggregate({
          where: { ...courseFilter, isHidden: false },
          _avg: { rating: true },
          _count: { id: true },
        }),
        prisma.review.groupBy({
          by: ['rating'],
          where: { ...courseFilter, isHidden: false },
          _count: { id: true },
          orderBy: { rating: 'asc' },
        }),
      ]);

      const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
        star,
        count: distribution.find((d) => d.rating === star)?._count?.id ?? 0,
      }));

      return {
        averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
        totalReviews: aggregate._count.id,
        ratingDistribution,
      };
    } catch {
      // ถ้า Schema ยังไม่ Migrate หรือ Query ล้มเหลว — คืนค่า default ปลอดภัย
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [1, 2, 3, 4, 5].map((star) => ({ star, count: 0 })),
      };
    }
  }

  /** ดึง 6 รีวิวล่าสุดของครู — graceful fallback ถ้า query ล้มเหลว */
  private async _getRecentReviews(tutorId: string) {
    try {
      return await prisma.review.findMany({
        where: {
          isHidden: false,
          course: {
            OR: [
              { teacherId: tutorId },
              { teachers: { some: { teacherId: tutorId } } },
            ],
          },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          helpful: true,
          user: { select: { name: true, profileImage: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
    } catch {
      // ถ้า Schema ยังไม่ Migrate หรือ isHidden ไม่มี — คืน array ว่าง
      return [];
    }
  }
}

export const tutorService = new TutorService();
