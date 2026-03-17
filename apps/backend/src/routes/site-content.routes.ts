import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware.js';
import { siteContentService } from '../services/site-content.service.js';

const router: Router = Router();

const ALLOWED_KEYS = [
  'students',
  'stats',
  'universities',
  'tutors',
  'testimonial',
  'faqs',
  'platform',
];

/** GET /api/site-content — all sections (public) */
router.get('/', async (_req, res: Response) => {
  try {
    const data = await siteContentService.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch site content' });
  }
});

/** GET /api/site-content/:key — single section (public) */
router.get('/:key', async (req, res: Response) => {
  const key = req.params.key as string;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(404).json({ success: false, error: 'Unknown section key' });
  }
  try {
    const data = await siteContentService.getByKey(key);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch section' });
  }
});

/** PUT /api/site-content/:key — update section (ADMIN only) */
router.put('/:key', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const key = req.params.key as string;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({ success: false, error: 'Unknown section key' });
  }
  try {
    const updated = await siteContentService.upsert(key, req.body);
    res.json({ success: true, data: updated.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update section' });
  }
});

export default router;
