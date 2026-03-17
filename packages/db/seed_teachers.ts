import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding test teachers...");
    
    // Create new Teacher profiles
    await prisma.teacher.createMany({
        data: [
            {
                name: "Kroo P Ohm",
                nickname: "ครูพี่โอม",
                email: "ohm@sigmatutor.com",
                title: "Physics Master",
                bio: "ผู้เชี่ยวชาญด้านฟิสิกส์มัธยมปลาย ประสบการณ์สอนกว่า 10 ปี สร้างเด็กสอบติดวิศวะฬ จุฬาฯ มาแล้วนับไม่ถ้วน ด้วยเทคนิคการสอนที่เข้าใจง่าย เน้นพลิกแพลงโจทย์ได้ทุกรูปแบบ",
                expertise: "Physics, TCAS, PAT3",
                experience: "ติวเตอร์ประจำสถาบันกวดวิชาชั้นนำ 10 ปี\nวิทยากรรับเชิญบรรยายฟิสิกส์โรงเรียนมัธยมกว่า 50 แห่ง",
                education: "ปริญญาตรี วิศวกรรมศาสตร์บัณฑิต จุฬาลงกรณ์มหาวิทยาลัย (เกียรตินิยมอันดับ 1)\nปริญญาโท วิศวกรรมศาสตร์มหาบัณฑิต จุฬาลงกรณ์มหาวิทยาลัย",
                socialLink: "https://youtube.com/kroop-ohm",
            },
            {
                name: "Kroo P Aom",
                nickname: "ครูพี่ออม",
                email: "aom@sigmatutor.com",
                title: "English Expert",
                bio: "ติวเตอร์ภาษาอังกฤษอารมณ์ดี ที่จะเปลี่ยนภาษาอังกฤษให้เป็นเรื่องง่ายและสนุก พร้อมเทคนิคทำข้อสอบ Grammar และ Reading ที่ใช้ได้จริงในห้องสอบ",
                expertise: "English, IELTS, TOEIC",
                experience: "ติวเตอร์อิสระ 8 ปี\nผู้แต่งหนังสือ Grammar ตัวแม่",
                education: "อักษรศาสตรบัณฑิต จุฬาลงกรณ์มหาวิทยาลัย",
                socialLink: "https://instagram.com/kroop-aom",
            }
        ],
        skipDuplicates: true
    });
    
    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
