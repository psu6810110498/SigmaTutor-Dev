
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Instructors ---');
    const users = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' } });
    users.forEach(u => console.log(`Instructor: ${u.name} (${u.nickname}, ${u.email}) - ID: ${u.id}`));

    console.log('\n--- Checking Categories ---');
    const cats = await prisma.category.findMany();
    cats.forEach(c => console.log(`Category: ${c.name} (${c.slug}) - ID: ${c.id}`));

    console.log('\n--- Checking Courses ---');
    const courses = await prisma.course.findMany();
    courses.forEach(c => console.log(`Course: ${c.title} - Instructor: ${c.instructorId} - Category: ${c.categoryId}`));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
