import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';
import { prisma } from '@sigma/db'; // นำเข้า prisma จาก package db ของคุณ

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploadService = new UploadService();

// POST /api/upload/profile
router.post('/profile', upload.single('image'), async (req: Request, res: Response) => {
  try {
    // 1. ตรวจสอบว่ามีไฟล์ส่งมาไหม
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบไฟล์รูปภาพ' });
    }

    // 2. สมมติว่าคุณได้ userId มาจาก Token (Middleware) 
    // ในที่นี้ผมขอใส่เป็นตัวแปรสมมติไว้ก่อนนะครับ
    const userId = req.body.userId; 

    // 3. อัปโหลดรูปไปที่ Cloudflare R2
    const result = await uploadService.uploadFile(req.file, 'profiles');
    
    // 4. ✅ ขั้นตอนสำคัญ: บันทึก URL ลงใน Neon DB ผ่าน Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: result.url // นำ URL ที่ได้จาก R2 มาบันทึก
      }
    });

    return res.status(200).json({
      message: 'อัปโหลดและบันทึกรูปโปรไฟล์สำเร็จ!',
      url: result.url,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

export default router;