import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';
import { stripe } from '../lib/stripe.js';
import express from 'express';

const router: Router = Router();

/**
 * GET /api/payments/admin
 * List all payments for admin dashboard (admin only)
 */
router.get(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page, limit, status, search, sort } = req.query;
      const result = await paymentService.listForAdmin({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        sort: sort as any,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch payments';
      res.status(500).json({ success: false, error: message });
    }
  }
);

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

/**
 * POST /api/payments/verify-session
 * Verify a Stripe checkout session and complete enrollment.
 * Called by the frontend after redirect from Stripe.
 * Idempotent — safe to call multiple times.
 */
router.post(
  '/verify-session',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({ success: false, error: 'Missing sessionId' });
        return;
      }

      const result = await paymentService.verifySession(sessionId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify session';
      res.status(400).json({ success: false, error: message });
    }
  }
);

export default router;
