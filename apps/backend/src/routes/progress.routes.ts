import { Router, Response } from 'express';
import { progressService } from '../services/progress.service.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Toggle progress for a lesson or schedule
router.post('/toggle', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { courseId, lessonId, scheduleId } = req.body;

        if (!courseId || (!lessonId && !scheduleId)) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const access = await progressService.checkEnrollmentAccess(userId, courseId, req.user?.role);
        if (!access.allowed) {
            return res.status(403).json({ success: false, error: access.reason });
        }

        const progress = await progressService.toggleProgress(userId, courseId, { lessonId, scheduleId });
        res.json({ success: true, data: progress });
    } catch (error: any) {
        console.error('Toggle progress error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

// Get progress for a specific course
router.get('/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const courseId = req.params.courseId as string;

        const progress = await progressService.getProgressByCourse(userId, courseId);
        res.json({ success: true, data: progress });
    } catch (error: any) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

// Update watch time
router.patch('/watch-time', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { courseId, lessonId, scheduleId, watchedSeconds } = req.body;

        if (!courseId || (!lessonId && !scheduleId) || watchedSeconds === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const access = await progressService.checkEnrollmentAccess(userId, courseId, req.user?.role);
        if (!access.allowed) {
            return res.status(403).json({ success: false, error: access.reason });
        }

        const progress = await progressService.updateWatchTime(userId, courseId, { lessonId, scheduleId, watchedSeconds });
        res.json({ success: true, data: progress });
    } catch (error: any) {
        console.error('Update watch time error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

export default router;
