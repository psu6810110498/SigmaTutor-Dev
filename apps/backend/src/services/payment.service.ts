import { prisma } from '@sigma/db';
import { stripe } from '../lib/stripe.js';
import type Stripe from 'stripe';

interface CartItem {
  courseId: string;
  title: string;
  price: number; // in THB (baht)
}

interface CreateCheckoutInput {
  items: CartItem[];
}

export class PaymentService {
  /**
   * Create a Stripe Checkout Session for card + PromptPay payments
   */
  async createCheckoutSession(userId: string, input: CreateCheckoutInput) {
    const { items } = input;

    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate all courses exist and are published
    for (const item of items) {
      const course = await prisma.course.findUnique({
        where: { id: item.courseId },
      });

      if (!course) {
        throw new Error(`Course not found: ${item.courseId}`);
      }

      if (course.status !== 'PUBLISHED') {
        throw new Error(`Course is not available: ${item.title}`);
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: item.courseId },
        },
      });

      if (existing) {
        throw new Error(`Already enrolled in: ${item.title}`);
      }
    }

    // Build Stripe line items (price in satang = THB * 100)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: 'thb',
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price * 100), // Convert THB to satang
      },
      quantity: 1,
    }));

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel`,
      metadata: {
        userId,
        courseIds: items.map((i) => i.courseId).join(','),
      },
    });

    // Create payment records for each course
    for (const item of items) {
      await prisma.payment.create({
        data: {
          userId,
          courseId: item.courseId,
          amount: item.price,
          status: 'PENDING',
          stripeId: session.id,
        },
      });
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutExpired(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful checkout — mark payments as completed + create enrollments
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const courseIds = session.metadata?.courseIds?.split(',') || [];

    if (!userId || courseIds.length === 0) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Update ALL payment records with this session ID
    await prisma.payment.updateMany({
      where: { stripeId: session.id },
      data: { status: 'COMPLETED' },
    });

    // Create enrollments for each course
    for (const courseId of courseIds) {
      // Skip if already enrolled (idempotent)
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      if (!existing) {
        await prisma.enrollment.create({
          data: { userId, courseId },
        });
      }
    }

    console.log(`✅ Checkout completed for user ${userId}, courses: ${courseIds.join(', ')}`);
  }

  /**
   * Handle expired checkout — mark payments as failed
   */
  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    await prisma.payment.updateMany({
      where: { stripeId: session.id },
      data: { status: 'FAILED' },
    });

    console.log(`❌ Checkout expired for session ${session.id}`);
  }
}

export const paymentService = new PaymentService();
