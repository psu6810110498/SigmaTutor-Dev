import express, { Router, Response, Request, NextFunction } from 'express'; // ✅ นำเข้า express เพิ่มเติม
import { scheduleService } from '../services/schedule.service.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// "Master Key" Middleware
const forceInjectToken = (req: any, res: Response, next: NextFunction) => {
    let token = '';
    if (req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)(accessToken|token)=([^;]+)/);
        if (match) token = match[2];
    }
    if (token) {
        req.headers.authorization = `Bearer ${token}`;
        if (!req.cookies) req.cookies = {};
        req.cookies.accessToken = token;
        req.cookies.token = token;
    }
    next();
};

// ✅ ใส่ `express.json()` เป็นด่านแรกสุดเพื่อให้มันอ่าน req.body ได้
router.put('/sync/:courseId', express.json(), forceInjectToken, authenticate, requireRole('ADMIN'),
    async (req: AuthRequest, res: Response) => {
        try {
            // ✅ ใช้เครื่องหมาย ? (Optional Chaining) ป้องกันแอปพัง ถ้าหา req.body ไม่เจอให้ใช้ Array ว่างแทน
            const sessions = req.body?.sessions || [];
            
            const result = await scheduleService.sync(req.params.courseId, sessions);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error("Sync Error:", error);
            res.status(400).json({ success: false, error: 'Failed to sync content' });
        }
    }
);

// ── คง API เดิมไว้ และใส่ express.json() กันเหนียวไว้ทุกอัน ──
router.post('/', express.json(), forceInjectToken, authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, ...data } = req.body || {};
        const schedule = await scheduleService.create(courseId, data);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to create' }); }
});

router.put('/:id', express.json(), forceInjectToken, authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const schedule = await scheduleService.update(String(req.params.id), req.body || {});
        res.json({ success: true, data: schedule });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to update' }); }
});

router.delete('/:id', forceInjectToken, authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        await scheduleService.delete(String(req.params.id));
        res.json({ success: true });
    } catch (error) { res.status(400).json({ success: false, error: 'Failed to delete' }); }
});

export default router;