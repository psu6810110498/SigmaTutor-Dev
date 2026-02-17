// ============================================================
// Seed — ข้อมูลตั้งต้นสำหรับ Category + Level
// Run: pnpm --filter @sigma/db db:seed
// ============================================================

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------
// หมวดหมู่วิชา
// ------------------------------------------------------------
const CATEGORIES = [
    { name: "คณิตศาสตร์", slug: "math" },
    { name: "ฟิสิกส์", slug: "physics" },
    { name: "เคมี", slug: "chemistry" },
    { name: "ชีววิทยา", slug: "biology" },
    { name: "ภาษาอังกฤษ", slug: "english" },
    { name: "ภาษาไทย", slug: "thai" },
    { name: "สังคมศึกษา", slug: "social" },
    { name: "PAT", slug: "pat" },
    { name: "GAT", slug: "gat" },
    { name: "โปรแกรมมิ่ง", slug: "programming" },
];

// ------------------------------------------------------------
// ระดับชั้น (order ใช้สำหรับเรียงลำดับ)
// ------------------------------------------------------------
const LEVELS = [
    { name: "ม.1", slug: "m1", order: 1 },
    { name: "ม.2", slug: "m2", order: 2 },
    { name: "ม.3", slug: "m3", order: 3 },
    { name: "ม.4", slug: "m4", order: 4 },
    { name: "ม.5", slug: "m5", order: 5 },
    { name: "ม.6", slug: "m6", order: 6 },
    { name: "มหาวิทยาลัย", slug: "university", order: 7 },
    { name: "ทั่วไป", slug: "general", order: 8 },
];

// ------------------------------------------------------------
// Main Seed Function
// ------------------------------------------------------------
async function main() {
    console.log("🌱 Seeding database...\n");

    // Seed Categories
    console.log("📚 Seeding categories...");
    for (const cat of CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name },
            create: cat,
        });
    }
    console.log(`   ✅ ${CATEGORIES.length} categories seeded`);

    // Seed Levels
    console.log("📊 Seeding levels...");
    for (const lvl of LEVELS) {
        await prisma.level.upsert({
            where: { slug: lvl.slug },
            update: { name: lvl.name, order: lvl.order },
            create: lvl,
        });
    }
    console.log(`   ✅ ${LEVELS.length} levels seeded`);

    console.log("\n🎉 Seeding complete!");
}

// Run seed
main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
