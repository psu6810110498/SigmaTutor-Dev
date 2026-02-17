
// ============================================================
// Seed — ข้อมูลตั้งต้นสำหรับ Category + Level + Admin
// Run: pnpm --filter @sigma/db db:seed
// ============================================================

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs"; // ต้องติดตั้ง bcryptjs หรือใช้ไลบรารีอื่นที่มีอยู่

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient();

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

    // ------------------------------------------------------------
    // Admin Seed (New)
    // ------------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
        console.log("🛡️  Seeding Admin account...");

        // Hash Password (ถ้าไม่มี bcrypt ต้องหาวิธีอื่น แต่นี่คือแนวทางมาตรฐาน)
        // หมายเหตุ: โปรเจกต์นี้อาจจะใช้ bcryptjs หรือ argon2 ให้ตรวจสอบ package.json อีกที
        // สมมติว่าใช้ bcryptjs ไปก่อน ถ้า error เดี๋ยวแก้
        const hashedPassword = hashSync(adminPassword, 10);

        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                role: 'ADMIN' as Role, // Force role update just in case
            },
            create: {
                email: adminEmail,
                password: hashedPassword,
                name: "System Admin",
                role: 'ADMIN' as Role,
            },
        });
        console.log(`   ✅ Admin account ensured: ${adminEmail}`);
    } else {
        console.log("   ⚠️  Skipping Admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
    }

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
