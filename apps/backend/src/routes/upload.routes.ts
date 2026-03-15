import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';
import { prisma } from '@sigma/db'; // นำเข้า prisma จาก package db ของคุณ
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploadService = new UploadService();

// multer สำหรับ PDF — จำกัด 50MB + เฉพาะ MIME type ที่ถูกต้อง
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น'));
    }
  }
});

// POST /api/upload/profile (Existing - Keep it)
router.post('/profile', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'กรุณาแนบไฟล์รูปภาพ' });
    const userId = req.body.userId;
    const result = await uploadService.uploadFile(req.file, 'profiles');
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: result.url }
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

// POST /api/upload/image (New - Generic Upload)
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to R2 (folder: 'images')
    const result = await uploadService.uploadFile(req.file, 'images');

    return res.status(200).json({
      success: true,
      url: result.url
    });
  } catch (error: any) {
    console.error('Generic Upload Error:', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

/**
 * POST /api/upload/lesson-material
 * อัปโหลด PDF เอกสารประกอบบทเรียนไปยัง Cloudflare R2
 * - ต้อง login และเป็น ADMIN / INSTRUCTOR
 * - รับเฉพาะ application/pdf
 * - จำกัด 50MB
 */
router.post(
  '/lesson-material',
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  pdfUpload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'กรุณาแนบไฟล์ PDF' });
        return;
      }
      const result = await uploadService.uploadFile(req.file, 'lesson-materials');
      res.json({
        success: true,
        url: result.url,
        key: result.key,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (error: any) {
      console.error('Lesson Material Upload Error:', error);
      if (error.message?.includes('PDF')) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'อัปโหลดไฟล์ไม่สำเร็จ' });
      }
    }
  }
);

export default router;