import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { stripe } from '../lib/stripe.js';
import express from 'express';

const router: Router = Router();

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe Checkout Session (authenticated users)
 */
router.post(
  '/create-checkout-session',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await paymentService.createCheckoutSession(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * POST /api/payments/verify-session
 * Manually verify a checkout session after redirect
 */
router.post(
  '/verify-session',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, error: 'sessionId is required' });
        return;
      }
      await paymentService.verifyAndEnroll(sessionId);
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify session';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint — verifies signature and processes events
 * NOTE: This route uses express.raw() middleware, set up in index.ts
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      await paymentService.handleWebhook(event);
      res.status(200).json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook error';
      console.error('❌ Webhook error:', message);
      res.status(400).json({ error: `Webhook Error: ${message}` });
    }
  }
);

export default router;
