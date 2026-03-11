import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      courseId: true,
      rating: true,
      isHidden: true,
      comment: true
    }
  });
  
  console.log('--- ALL REVIEWS IN DB ---');
  console.log(JSON.stringify(reviews, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
