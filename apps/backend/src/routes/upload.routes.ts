import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';
import { prisma } from '@sigma/db'; // นำเข้า prisma จาก package db ของคุณ

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploadService = new UploadService();

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

export default router;