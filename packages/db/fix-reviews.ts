import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for reviews with isHidden = null...');
  
  // Update any reviews where isHidden is null (using raw query if Prisma type doesn't allow null)
  // Or just update all reviews where isHidden is not false explicitly
  const result = await prisma.$executeRaw`UPDATE "reviews" SET "isHidden" = false WHERE "isHidden" IS NULL`;
  
  console.log(`Updated ${result} reviews that had NULL isHidden values.`);
  
  // Also check if there are any reviews at all
  const count = await prisma.review.count();
  console.log(`Total reviews in DB: ${count}`);
  
  const visibleCount = await prisma.review.count({ where: { isHidden: false } });
  console.log(`Visible reviews (isHidden=false): ${visibleCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
