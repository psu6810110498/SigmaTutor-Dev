import express, { Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { dashboardService } from '../services/dashboard.service.js';

const router = express.Router();

router.get(
  '/admin/stats',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await dashboardService.getAdminStats();
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
