import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting enrollment seeder...');

    // ล้างไอดีเก่าก่อนเพื่อความชัวร์
    await prisma.user.deleteMany({
        where: { email: { in: ['student1@test.com', 'student2@test.com'] } }
    });
    console.log('🧹 Cleaned up old test students.');

    // 1. หาคอร์สที่เผยแพร่แล้ว 1 อัน
    let course = await prisma.course.findFirst({
        where: { status: 'PUBLISHED' }
    });

    if (!course) {
        console.log('⚠️ No published course found. Retrieving any course and publishing it temporarily...');
        course = await prisma.course.findFirst();
        if (course) {
            await prisma.course.update({
                where: { id: course.id },
                data: { status: 'PUBLISHED' }
            });
        }
    }

    if (!course) {
        console.log('❌ No courses exist in the database! Please create a course first.');
        return;
    }

    console.log(`📚 Selected Course: ${course.title} (${course.id})`);

    // 2. สร้างนักเรียนสมมติ 2 คน
    const testStudents = [
        {
            email: 'student1@test.com',
            name: 'นักเรียน สมมติ 1',
            password: await bcrypt.hash('password123', 12),
            role: 'USER',
        },
        {
            email: 'student2@test.com',
            name: 'นักเรียน สมมติ 2',
            password: await bcrypt.hash('password123', 12),
            role: 'USER',
        }
    ];

    for (const data of testStudents) {
        let user = await prisma.user.findUnique({ where: { email: data.email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    password: data.password,
                    role: 'USER' as any, // TypeScript workaround
                }
            });
            console.log(`👤 Created test user: ${user.name} (${user.email})`);
        } else {
            console.log(`👤 Test user already exists: ${user.name}`);
        }

        // 3. แนบ Enrollment และ Payment
        const existingEnroll = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: course.id
                }
            }
        });

        if (!existingEnroll) {
            await prisma.enrollment.create({
                data: {
                    userId: user.id,
                    courseId: course.id,
                    status: 'ACTIVE'
                }
            });
            await prisma.payment.create({
                data: {
                    userId: user.id,
                    courseId: course.id,
                    amount: course.price,
                    status: 'COMPLETED',
                    stripeId: `mock_stripe_${Date.now()}`
                }
            });
            console.log(`✅ Enrolled ${user.name} into ${course.title}`);
        } else {
            console.log(`ℹ️ ${user.name} is already enrolled in ${course.title}`);
        }
    }

    console.log('\n🎉 Seeding complete!');
    console.log('--------------------------------------------------');
    console.log('👉 You can now login with:');
    console.log('1. Email: student1@test.com | Password: password123');
    console.log('2. Email: student2@test.com | Password: password123');
    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
