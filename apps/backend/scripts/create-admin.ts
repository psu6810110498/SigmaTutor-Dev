
import { prisma } from '@sigma/db';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient(); // Removed

async function main() {
    const email = 'admin@sigma.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN' },
        create: {
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`✅ Admin user created/updated: ${admin.email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
