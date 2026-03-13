import { prisma } from '@sigma/db';

export class DashboardService {
  async getAdminStats() {
    const [totalCourses, totalStudents, totalRevenueAggregate, totalEnrollments] =
      await Promise.all([
        prisma.course.count(),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' },
        }),
        prisma.enrollment.count(),
      ]);

    const totalRevenue = totalRevenueAggregate._sum.amount || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = 7;
    const dailyStats = await Promise.all(
      Array.from({ length: days }).map(async (_v, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - index));

        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);

        const [revenueAgg, enrollmentsCount] = await Promise.all([
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: 'COMPLETED',
              createdAt: { gte: start, lt: end },
            },
          }),
          prisma.enrollment.count({
            where: {
              createdAt: { gte: start, lt: end },
            },
          }),
        ]);

        return {
          date: start.toISOString().slice(0, 10),
          revenue: revenueAgg._sum.amount || 0,
          enrollments: enrollmentsCount,
        };
      })
    );

    // Top 5 courses by revenue (completed payments only)
    const topCoursesByRevenue = await prisma.payment.groupBy({
      by: ['courseId'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const topCoursesWithMeta = await Promise.all(
      topCoursesByRevenue.map(async (item) => {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: { id: true, title: true },
        });
        return {
          courseId: item.courseId,
          courseTitle: course?.title || 'ไม่ทราบชื่อคอร์ส',
          revenue: item._sum.amount || 0,
        };
      })
    );

    // Payment status distribution
    const paymentStatusRaw = await prisma.payment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const paymentStatus = paymentStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // New students over last 7 days
    const newStudentsDaily = await Promise.all(
      Array.from({ length: days }).map(async (_v, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - index));

        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);

        const count = await prisma.user.count({
          where: {
            role: 'USER',
            createdAt: { gte: start, lt: end },
          },
        });

        return {
          date: start.toISOString().slice(0, 10),
          count,
        };
      })
    );

    // Monthly metrics for last 12 months
    const monthKeys: string[] = [];
    const monthLabels: { [key: string]: { start: Date; end: Date } } = {};

    const monthCursor = new Date(today);
    monthCursor.setDate(1);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(monthCursor);
      d.setMonth(monthCursor.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
      monthLabels[key] = { start, end };
    }

    const firstMonthStart = monthLabels[monthKeys[0]].start;

    const [paymentsLastYear, usersLastYear, coursesLastYear] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: firstMonthStart } },
        select: { amount: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { role: 'USER', createdAt: { gte: firstMonthStart } },
        select: { createdAt: true },
      }),
      prisma.course.findMany({
        where: { createdAt: { gte: firstMonthStart } },
        select: { createdAt: true },
      }),
    ]);

    const monthlyRevenueMap = new Map<string, number>();
    const monthlyNewStudentsMap = new Map<string, number>();
    const monthlyNewCoursesMap = new Map<string, number>();

    for (const key of monthKeys) {
      monthlyRevenueMap.set(key, 0);
      monthlyNewStudentsMap.set(key, 0);
      monthlyNewCoursesMap.set(key, 0);
    }

    const getMonthKey = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    for (const p of paymentsLastYear) {
      const key = getMonthKey(p.createdAt);
      if (!monthlyRevenueMap.has(key)) continue;
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + p.amount);
    }

    for (const u of usersLastYear) {
      const key = getMonthKey(u.createdAt);
      if (!monthlyNewStudentsMap.has(key)) continue;
      monthlyNewStudentsMap.set(key, (monthlyNewStudentsMap.get(key) || 0) + 1);
    }

    for (const c of coursesLastYear) {
      const key = getMonthKey(c.createdAt);
      if (!monthlyNewCoursesMap.has(key)) continue;
      monthlyNewCoursesMap.set(key, (monthlyNewCoursesMap.get(key) || 0) + 1);
    }

    const monthlyRevenue = monthKeys.map((key) => ({
      month: key,
      value: monthlyRevenueMap.get(key) || 0,
    }));

    const monthlyNewStudents = monthKeys.map((key) => ({
      month: key,
      value: monthlyNewStudentsMap.get(key) || 0,
    }));

    const monthlyNewCourses = monthKeys.map((key) => ({
      month: key,
      value: monthlyNewCoursesMap.get(key) || 0,
    }));

    // Rating distribution & top rated courses
    const reviews = await prisma.review.findMany({
      select: {
        rating: true,
        courseId: true,
      },
    });

    const ratingDistributionMap = new Map<number, number>();
    for (let r = 1; r <= 5; r++) ratingDistributionMap.set(r, 0);

    const courseRatingAgg = new Map<
      string,
      {
        sum: number;
        count: number;
      }
    >();

    for (const r of reviews) {
      const current = ratingDistributionMap.get(r.rating) || 0;
      ratingDistributionMap.set(r.rating, current + 1);

      const agg = courseRatingAgg.get(r.courseId) || { sum: 0, count: 0 };
      agg.sum += r.rating;
      agg.count += 1;
      courseRatingAgg.set(r.courseId, agg);
    }

    const ratingDistribution = Array.from(ratingDistributionMap.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => a.rating - b.rating);

    const courseIds = Array.from(courseRatingAgg.keys());
    const courseMeta = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    });
    const courseTitleMap = new Map(courseMeta.map((c) => [c.id, c.title] as const));

    const topRatedCourses = Array.from(courseRatingAgg.entries())
      .map(([courseId, agg]) => ({
        courseId,
        courseTitle: courseTitleMap.get(courseId) || 'ไม่ทราบชื่อคอร์ส',
        avgRating: agg.count > 0 ? agg.sum / agg.count : 0,
        reviewCount: agg.count,
      }))
      .filter((c) => c.reviewCount >= 3)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // Tutor-level aggregates: revenue, students, courses, rating
    const [teachers, tutorCourses, tutorPayments, tutorReviews] = await Promise.all([
      prisma.teacher.findMany({
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      }),
      prisma.course.findMany({
        select: {
          id: true,
          teacherId: true,
        },
      }),
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: {
          amount: true,
          userId: true,
          course: {
            select: {
              teacherId: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        select: {
          rating: true,
          course: {
            select: {
              teacherId: true,
            },
          },
        },
      }),
    ]);

    type TutorAggregate = {
      tutorId: string;
      name: string;
      profileImage: string | null;
      courseCount: number;
      revenue: number;
      studentIds: Set<string>;
      ratingSum: number;
      ratingCount: number;
    };

    const tutorMap = new Map<string, TutorAggregate>();

    // Seed from teachers
    for (const t of teachers) {
      tutorMap.set(t.id, {
        tutorId: t.id,
        name: t.name || 'ไม่ระบุชื่อ',
        profileImage: t.profileImage ?? null,
        courseCount: 0,
        revenue: 0,
        studentIds: new Set<string>(),
        ratingSum: 0,
        ratingCount: 0,
      });
    }

    // Courses per tutor
    for (const c of tutorCourses) {
      if (!c.teacherId) continue;
      const agg = tutorMap.get(c.teacherId);
      if (!agg) continue;
      agg.courseCount += 1;
    }

    // Revenue & students per tutor
    for (const p of tutorPayments) {
      const teacherId = p.course?.teacherId;
      if (!teacherId) continue;
      const agg = tutorMap.get(teacherId);
      if (!agg) continue;
      agg.revenue += p.amount;
      if (p.userId) {
        agg.studentIds.add(p.userId);
      }
    }

    // Ratings per tutor
    for (const r of tutorReviews) {
      const teacherId = r.course?.teacherId;
      if (!teacherId) continue;
      const agg = tutorMap.get(teacherId);
      if (!agg) continue;
      agg.ratingSum += r.rating;
      agg.ratingCount += 1;
    }

    const tutors = Array.from(tutorMap.values())
      .map((t) => ({
        tutorId: t.tutorId,
        name: t.name,
        profileImage: t.profileImage,
        courseCount: t.courseCount,
        revenue: t.revenue,
        studentCount: t.studentIds.size,
        avgRating: t.ratingCount > 0 ? t.ratingSum / t.ratingCount : 0,
      }))
      // Order by revenue desc by default
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totals: {
        courses: totalCourses,
        students: totalStudents,
        revenue: totalRevenue,
        enrollments: totalEnrollments,
      },
      daily: dailyStats,
      topCoursesByRevenue: topCoursesWithMeta,
      paymentStatus,
      newStudentsDaily,
      monthlyRevenue,
      monthlyNewStudents,
      monthlyNewCourses,
      ratingDistribution,
      topRatedCourses,
      tutors,
    };
  }
}

export const dashboardService = new DashboardService();
