import { prisma } from '@sigma/db';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  tutorId?: string;
}

export class DashboardService {
  async getAdminStats(filters?: DashboardFilters) {
    // 1. Build Base Where Clauses
    const dateCondition: any = {};
    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      dateCondition.gte = start;
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.lte = end;
    }
    const hasDateFilter = Object.keys(dateCondition).length > 0;

    const courseWhere: any = {};
    if (hasDateFilter) courseWhere.createdAt = dateCondition;
    if (filters?.courseId) courseWhere.id = filters.courseId;
    if (filters?.tutorId) courseWhere.teacherId = filters.tutorId;

    const paymentWhere: any = { status: 'COMPLETED' };
    if (hasDateFilter) paymentWhere.createdAt = dateCondition;
    if (filters?.courseId) paymentWhere.courseId = filters.courseId;
    if (filters?.tutorId) paymentWhere.course = { teacherId: filters.tutorId };

    const enrollmentWhere: any = {};
    if (hasDateFilter) enrollmentWhere.createdAt = dateCondition;
    if (filters?.courseId) enrollmentWhere.courseId = filters.courseId;
    if (filters?.tutorId) enrollmentWhere.course = { teacherId: filters.tutorId };

    const reviewWhere: any = {};
    if (hasDateFilter) reviewWhere.createdAt = dateCondition;
    if (filters?.courseId) reviewWhere.courseId = filters.courseId;
    if (filters?.tutorId) reviewWhere.course = { teacherId: filters.tutorId };

    const userWhere: any = { role: 'USER' };
    if (hasDateFilter) userWhere.createdAt = dateCondition;
    if (filters?.courseId || filters?.tutorId) {
      userWhere.enrollments = { some: {} };
      if (filters?.courseId) userWhere.enrollments.some.courseId = filters.courseId;
      if (filters?.tutorId) userWhere.enrollments.some.course = { teacherId: filters.tutorId };
    }

    // 2. Fetch Totals
    const [totalCourses, totalStudents, totalRevenueAggregate, totalEnrollments] =
      await Promise.all([
        prisma.course.count({ where: courseWhere }),
        prisma.user.count({ where: userWhere }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: paymentWhere,
        }),
        prisma.enrollment.count({ where: enrollmentWhere }),
      ]);

    const totalRevenue = totalRevenueAggregate._sum.amount || 0;

    // 3. Daily Stats (Adaptive Range)
    let dailyEndDate = new Date();
    dailyEndDate.setHours(23, 59, 59, 999);
    let dailyStartDate = new Date(dailyEndDate);
    dailyStartDate.setDate(dailyEndDate.getDate() - 6);
    dailyStartDate.setHours(0, 0, 0, 0);

    if (filters?.startDate) {
      dailyStartDate = new Date(filters.startDate);
      dailyStartDate.setHours(0, 0, 0, 0);
    }
    // If end date is provided, limit the end. Keep start date explicitly if provided, else offset by 6 days.
    if (filters?.endDate) {
      dailyEndDate = new Date(filters.endDate);
      dailyEndDate.setHours(23, 59, 59, 999);
      if (!filters.startDate) {
        dailyStartDate = new Date(dailyEndDate);
        dailyStartDate.setDate(dailyEndDate.getDate() - 6);
        dailyStartDate.setHours(0, 0, 0, 0);
      }
    }

    const diffDays = Math.max(1, Math.ceil((dailyEndDate.getTime() - dailyStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const actualDays = Math.min(diffDays, 90); // Cap at 90 days to avoid huge queries

    const dailyStats = await Promise.all(
      Array.from({ length: actualDays }).map(async (_v, index) => {
        const start = new Date(dailyStartDate);
        start.setDate(dailyStartDate.getDate() + index);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const currentPaymentWhere = { ...paymentWhere, createdAt: { gte: start, lt: end } };
        const currentEnrollmentWhere = { ...enrollmentWhere, createdAt: { gte: start, lt: end } };

        const [revenueAgg, enrollmentsCount] = await Promise.all([
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: currentPaymentWhere,
          }),
          prisma.enrollment.count({
            where: currentEnrollmentWhere,
          }),
        ]);

        return {
          date: start.toISOString().slice(0, 10),
          revenue: revenueAgg._sum.amount || 0,
          enrollments: enrollmentsCount,
        };
      })
    );

    // 4. Top Courses By Revenue
    const topCoursesByRevenue = await prisma.payment.groupBy({
      by: ['courseId'],
      where: paymentWhere,
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

    // 5. Payment Status Distribution
    const paymentStatusBaseWhere: any = {};
    if (hasDateFilter) paymentStatusBaseWhere.createdAt = dateCondition;
    if (filters?.courseId) paymentStatusBaseWhere.courseId = filters.courseId;
    if (filters?.tutorId) paymentStatusBaseWhere.course = { teacherId: filters.tutorId };

    const paymentStatusRaw = await prisma.payment.groupBy({
      by: ['status'],
      where: paymentStatusBaseWhere,
      _count: { id: true },
    });

    const paymentStatus = paymentStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // 6. New Students Daily
    const newStudentsDaily = await Promise.all(
      Array.from({ length: actualDays }).map(async (_v, index) => {
        const start = new Date(dailyStartDate);
        start.setDate(dailyStartDate.getDate() + index);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const currentUserWhere = { ...userWhere, createdAt: { gte: start, lt: end } };

        const count = await prisma.user.count({
          where: currentUserWhere,
        });

        return {
          date: start.toISOString().slice(0, 10),
          count,
        };
      })
    );

    // 7. Monthly Metrics (Last 12 months based on endDate or today)
    const monthKeys: string[] = [];
    const monthLabels: { [key: string]: { start: Date; end: Date } } = {};

    const monthCursor = new Date(dailyEndDate);
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

    const monthlyPaymentWhere = { ...paymentWhere, createdAt: { gte: firstMonthStart, lte: dailyEndDate } };
    const monthlyUserWhere = { ...userWhere, createdAt: { gte: firstMonthStart, lte: dailyEndDate } };
    const monthlyCourseWhere = { ...courseWhere, createdAt: { gte: firstMonthStart, lte: dailyEndDate } };

    const [paymentsLastYear, usersLastYear, coursesLastYear] = await Promise.all([
      prisma.payment.findMany({
        where: monthlyPaymentWhere,
        select: { amount: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: monthlyUserWhere,
        select: { createdAt: true },
      }),
      prisma.course.findMany({
        where: monthlyCourseWhere,
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

    // 8. Rating Distribution & Top Rated Courses
    const reviews = await prisma.review.findMany({
      where: reviewWhere,
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
      .filter((c) => c.reviewCount >= 1) // Lowered to 1 so some data shows inside filters
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // 9. Tutor-level aggregates
    const teachersWhere: any = {};
    if (filters?.tutorId) teachersWhere.id = filters.tutorId;

    const tutorCoursesWhere: any = {};
    if (filters?.tutorId) tutorCoursesWhere.teacherId = filters.tutorId;
    if (filters?.courseId) tutorCoursesWhere.id = filters.courseId;
    if (hasDateFilter) tutorCoursesWhere.createdAt = dateCondition;

    const [teachers, tutorCourses, tutorPayments, tutorReviews] = await Promise.all([
      prisma.teacher.findMany({
        where: teachersWhere,
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      }),
      prisma.course.findMany({
        where: tutorCoursesWhere,
        select: {
          id: true,
          teacherId: true,
        },
      }),
      prisma.payment.findMany({
        where: paymentWhere,
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
        where: reviewWhere,
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

    for (const c of tutorCourses) {
      if (!c.teacherId) continue;
      const agg = tutorMap.get(c.teacherId);
      if (!agg) continue;
      agg.courseCount += 1;
    }

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
