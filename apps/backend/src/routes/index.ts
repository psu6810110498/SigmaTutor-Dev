import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import uploadRoutes from './upload.routes';

// ✅ ระบุ Type : express.Router เพื่อแก้ปัญหา inferred type
const router: express.Router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

export default router;