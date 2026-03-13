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
        educationHistory: true,
        achievements: true,
        quote: true,
        facebookUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        linkedinUrl: true,
        socialLink: true,
        _count: {
          select: { courses: { where: { status: 'PUBLISHED', published: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Attach aggregate review stats for each tutor
    const tutorsWithStats = await Promise.all(
      tutors.map(async (tutor) => {
        const stats = await this._getReviewStats(tutor.id);
        return { ...tutor, ...stats };
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
        educationHistory: true,
        achievements: true,
        quote: true,
        facebookUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        linkedinUrl: true,
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

    const [reviewStats, recentReviews] = await Promise.all([
      this._getReviewStats(id),
      this._getRecentReviews(id),
    ]);

    const totalStudents = await prisma.enrollment.count({
      where: {
        status: 'ACTIVE',
        course: {
          OR: [
            { teacherId: id },
            { courseTeachers: { some: { teacherId: id } } },
          ],
        },
      },
    });

    return {
      ...tutor,
      ...reviewStats,
      recentReviews,
      totalStudents,
    };
  }

  /** Aggregate review stats for a tutor across all their courses */
  private async _getReviewStats(tutorId: string) {
    const courseFilter = {
      course: {
        OR: [
          { teacherId: tutorId },
          { courseTeachers: { some: { teacherId: tutorId } } },
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
  }

  /** Fetch 6 most recent visible reviews across all tutor courses */
  private async _getRecentReviews(tutorId: string) {
    return prisma.review.findMany({
      where: {
        isHidden: false,
        course: {
          OR: [
            { teacherId: tutorId },
            { courseTeachers: { some: { teacherId: tutorId } } },
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
  }
}

export const tutorService = new TutorService();
