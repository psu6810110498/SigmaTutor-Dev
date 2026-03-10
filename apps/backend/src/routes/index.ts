import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import uploadRoutes from './upload.routes.js';
import gumletRoutes from './gumlet.routes.js';
import courseRoutes from './course.routes.js';
import paymentRoutes from './payment.routes.js';
import categoryRoutes from './category.routes.js';
import levelRoutes from './level.routes.js';
import chapterRoutes from './chapter.routes.js';
import lessonRoutes from './lesson.routes.js';
import reviewRoutes from './review.routes.js';
import scheduleRoutes from './schedule.routes.js';
import bannerRoutes from './banner.routes.js';
import tutorRoutes from './tutor.routes.js';
import couponRoutes from './coupon.routes.js';
import siteContentRoutes from './site-content.routes.js';
import progressRoutes from './progress.routes.js';

// ✅ ระบุ Type : express.Router เพื่อแก้ปัญหา inferred type
const router: express.Router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes); // Ensure this matches frontend expectation
router.use('/gumlet', gumletRoutes);
// Note: Frontend seems to expect /courses/:id/upload which is in courseRoutes
router.use('/courses', courseRoutes);
router.use('/payments', paymentRoutes);
router.use('/categories', categoryRoutes);
router.use('/levels', levelRoutes);
router.use('/chapters', chapterRoutes);
router.use('/lessons', lessonRoutes);
router.use('/reviews', reviewRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/banners', bannerRoutes);
router.use('/tutors', tutorRoutes);
router.use('/coupons', couponRoutes);
router.use('/site-content', siteContentRoutes);
router.use('/progress', progressRoutes);

export default router;
