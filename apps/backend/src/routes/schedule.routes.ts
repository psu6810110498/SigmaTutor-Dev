import { Router, Response } from 'express';
import { scheduleService } from '../services/schedule.service.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ✅ NEW: Sync Content (บันทึกเนื้อหาทั้งหมดในรอบเดียว)
router.put('/sync/:courseId', authenticate, requireRole('ADMIN'),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await scheduleService.sync(req.params.courseId, req.body.sessions);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to sync content' });
        }
    }
);

// ── คง API เดิมไว้เพื่อไม่ให้ส่วนอื่นพัง ──
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, ...data } = req.body;
        const schedule = await scheduleService.create(courseId, data);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to create' }); }
});

router.put('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const schedule = await scheduleService.update(String(req.params.id), req.body);
        res.json({ success: true, data: schedule });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to update' }); }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        await scheduleService.delete(String(req.params.id));
        res.json({ success: true });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to delete' }); }
});

export default router;