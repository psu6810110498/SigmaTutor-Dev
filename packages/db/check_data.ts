
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Teachers ---');
    const teachers = await prisma.teacher.findMany();
    teachers.forEach(t => console.log(`Teacher: ${t.name} (${t.nickname}, ${t.email}) - ID: ${t.id}`));

    console.log('\n--- Checking Categories ---');
    const cats = await prisma.category.findMany();
    cats.forEach(c => console.log(`Category: ${c.name} (${c.slug}) - ID: ${c.id}`));

    console.log('\n--- Checking Courses ---');
    const courses = await prisma.course.findMany();
    courses.forEach(c => console.log(`Course: ${c.title} - Teacher: ${c.teacherId} - Category: ${c.categoryId}`));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
