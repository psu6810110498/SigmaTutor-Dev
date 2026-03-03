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

    // Build the course filter: instructors must have ≥1 matching published course
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

    return prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        courses: { some: courseWhere },
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        profileImage: true,
        title: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}

export const tutorService = new TutorService();
