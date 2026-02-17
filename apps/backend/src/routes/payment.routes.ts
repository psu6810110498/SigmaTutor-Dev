import { Router, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { createPaymentSchema } from '../schemas/course.schema.js';

const router: Router = Router();

/**
 * POST /api/payments/checkout
 * Create a payment / checkout session (authenticated users)
 */
router.post(
    '/checkout',
    authenticate,
    validate(createPaymentSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await paymentService.createCheckout(req.user!.userId, req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
