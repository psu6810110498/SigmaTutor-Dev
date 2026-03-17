import { PrismaClient } from './packages/db';
const prisma = new PrismaClient();
async function main() {
  const course = await prisma.course.findFirst({
    where: { title: { contains: 'Test(Onsite)' } },
    include: { schedules: true }
  });
  console.log(JSON.stringify(course, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
