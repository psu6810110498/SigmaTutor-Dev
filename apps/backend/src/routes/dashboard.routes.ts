import express, { Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { dashboardService } from '../services/dashboard.service.js';

const router: express.Router = express.Router();

router.get(
  '/admin/stats',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        courseId: req.query.courseId as string | undefined,
        tutorId: req.query.tutorId as string | undefined,
      };
      
      const data = await dashboardService.getAdminStats(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
