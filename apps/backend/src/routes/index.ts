import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import uploadRoutes from './upload.routes';
import courseRoutes from './course.routes.js';
import paymentRoutes from './payment.routes.js';
import categoryRoutes from './category.routes.js';
import levelRoutes from './level.routes.js';

// ✅ ระบุ Type : express.Router เพื่อแก้ปัญหา inferred type
const router: express.Router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes); // Ensure this matches frontend expectation
// Note: Frontend seems to expect /courses/:id/upload which is in courseRoutes
router.use('/courses', courseRoutes);
router.use('/payments', paymentRoutes);
router.use('/categories', categoryRoutes);
router.use('/levels', levelRoutes);

export default router;