import { Router } from 'express';
import { bannerService } from '../services/banner.service.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Public: Get Active Banners
router.get('/active', async (req, res, next) => {
    try {
        const position = req.query.position as 'EXPLORE_TOP' | 'EXPLORE_MIDDLE' | undefined;
        const banners = await bannerService.getActiveBanners(position);
        res.json({ success: true, data: banners });
    } catch (error) {
        next(error);
    }
});

// Admin: Get All Banners
router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const banners = await bannerService.getAllBanners();
        res.json({ success: true, data: banners });
    } catch (error) {
        next(error);
    }
});

// Admin: Get Trashed Banners
router.get('/trash', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const banners = await bannerService.getTrashBanners();
        res.json({ success: true, data: banners });
    } catch (error) {
        next(error);
    }
});

// Admin: Create Banner
router.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const banner = await bannerService.create(req.body);
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        next(error);
    }
});

// Admin: Update Banner
router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const banner = await bannerService.update(String(req.params.id), req.body);
        res.json({ success: true, data: banner });
    } catch (error) {
        next(error);
    }
});

// Admin: Delete Banner (Soft)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await bannerService.delete(String(req.params.id));
        res.json({ success: true, message: 'Banner deleted (soft delete)' });
    } catch (error) {
        next(error);
    }
});

// Admin: Restore Banner
router.put('/:id/restore', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await bannerService.restore(String(req.params.id));
        res.json({ success: true, message: 'Banner restored' });
    } catch (error) {
        next(error);
    }
});

// Admin: Force Delete Banner
router.delete('/:id/force', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await bannerService.forceDelete(String(req.params.id));
        res.json({ success: true, message: 'Banner permanently deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
