import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const [instructors, totalUniqueStudents] = await Promise.all([
          prisma.teacher.findMany({
            select: {
              id: true,
              email: true,
              name: true,
              nickname: true,
              title: true,
              bio: true,
              profileImage: true,
              expertise: true,
              education: true,
              experience: true,
              socialLink: true,
              createdAt: true,
              courses: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  enrollments: {
                    select: {
                      userId: true,
                      status: true,
                      createdAt: true,
                      user: { select: { name: true, profileImage: true } },
                    },
                  },
                  payments: {
                    where: { status: 'COMPLETED' },
                    select: { amount: true },
                  },
                },
              },
              _count: {
                select: { courses: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where: { role: 'USER' } }),
        ]);
  
        const formattedData = instructors.map((inst) => {
          const allStudentIds = inst.courses.flatMap((c) => c.enrollments.map((e) => e.userId));
          const uniqueStudentsCount = new Set(allStudentIds).size;
  
          const totalEarnings = inst.courses.reduce((sum, course) => {
            let courseRevenue = course.payments.reduce((pSum, p) => pSum + Number(p.amount || 0), 0);
            if (courseRevenue === 0 && course.price && course.enrollments.length > 0) {
              const activeEnrollments = course.enrollments.filter(
                (e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
              ).length;
              courseRevenue = Number(course.price) * activeEnrollments;
            }
            return sum + courseRevenue;
          }, 0);
  
          return {
            ...inst,
            totalEarnings,
            _count: {
              courses: inst._count.courses,
              enrollments: uniqueStudentsCount,
            },
          };
        });
        
        console.log(JSON.stringify({ success: true, data: formattedData, totalUniqueStudents }, null, 2));

    } catch (e) {
        console.error("API ERROR:", e);
    }
}

main().finally(() => prisma.$disconnect());
