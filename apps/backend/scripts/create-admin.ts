
import { prisma } from '@sigma/db';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient(); // Removed

async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@sigma.com';
    const password = process.env.ADMIN_PASSWORD || 'password123';

    if (!process.env.ADMIN_PASSWORD) {
        console.warn('⚠️  Warning: Using default password. Set ADMIN_PASSWORD in .env for security.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            password: hashedPassword // Update password if it changed
        },
        create: {
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`✅ Admin user created/updated: ${admin.email}`);
}


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
