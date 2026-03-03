import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding a test coupon...');

    const existing = await prisma.coupon.findUnique({
        where: { code: 'WELCOME500' }
    });

    if (!existing) {
        const coupon = await prisma.coupon.create({
            data: {
                code: 'WELCOME500',
                discountType: 'FIXED_AMOUNT',
                discountValue: 500,
                usageLimit: 100,
                startDate: new Date(),
                isActive: true,
            }
        });

        const percentCoupon = await prisma.coupon.create({
            data: {
                code: 'SALE20',
                discountType: 'PERCENTAGE',
                discountValue: 20, // 20%
                maxDiscount: 2000,
                usageLimit: 100,
                startDate: new Date(),
                isActive: true,
            }
        });

        console.log(`✅ Created test coupons: ${coupon.code} (500 THB off), ${percentCoupon.code} (20% off)`);
    } else {
        console.log('✅ Test coupons already exist!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
