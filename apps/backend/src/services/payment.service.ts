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

      // 🌟 อนุญาตให้ซื้อซ้ำได้เฉพาะกรณีที่เคยทำรายการแต่ยังชำระไม่สำเร็จ
      if (existing && existing.status === 'ACTIVE') {
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
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        // 🌟 เพิ่ม Event ดักจับเงินเข้าจาก PromptPay
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        // 🌟 เพิ่ม Event ดักจับจ่ายเงินล้มเหลว
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
   * ใช้ $transaction เพื่อให้ payment update และ enrollment เป็น atomic
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // 🌟 ยืนยันว่าตัดเงินสำเร็จจริงๆ ป้องกันกรณี PromptPay แค่สแกนแต่เงินยังไม่หัก
    if (session.payment_status !== 'paid') {
      console.log(`⚠️ Checkout ${session.id} is pending payment (e.g., waiting for PromptPay).`);
      return;
    }

    const userId = session.metadata?.userId;
    const courseIds = session.metadata?.courseIds?.split(',') || [];

    if (!userId || courseIds.length === 0) {
      console.error('❌ Missing metadata in checkout session:', session.id);
      return;
    }

    // ✅ ใช้ transaction เพื่อให้ payment + enrollment เป็น atomic
    await prisma.$transaction(async (tx) => {
      // Update ALL payment records with this session ID
      await tx.payment.updateMany({
        where: { stripeId: session.id },
        data: { status: 'COMPLETED' },
      });

      // Create enrollments for each course
      for (const courseId of courseIds) {
        const existing = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });

        if (!existing) {
          await tx.enrollment.create({
            data: {
              userId,
              courseId,
              status: 'ACTIVE', // 🌟 ระบุสถานะให้ตรงกับที่ระบบจัดการนักเรียนดึงไปแสดงผล
            },
          });
        } else {
          // 🌟 อัปเดตสถานะให้เป็น ACTIVE เผื่อกรณีลูกค้าเคยกดค้างไว้เป็น PENDING
          await tx.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { status: 'ACTIVE' },
          });
        }
      }
    });

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

    console.log(`❌ Checkout expired or failed for session ${session.id}`);
  }

  /**
   * Verify a checkout session by session ID (called from frontend after redirect).
   * This acts as a fallback for webhook — retrieves session from Stripe API,
   * and if paid, completes the payment + enrollment atomically.
   * Idempotent: safe to call multiple times.
   */
  async verifySession(sessionId: string, userId: string) {
    // 1. Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Verify that this session belongs to the requesting user
    if (session.metadata?.userId !== userId) {
      throw new Error('Session does not belong to this user');
    }

    // 3. Check payment status
    if (session.payment_status !== 'paid') {
      return {
        status: session.payment_status,
        message: 'Payment has not been completed yet',
        enrolled: false,
      };
    }

    // 4. Complete payment + enrollment (same logic as webhook handler)
    await this.handleCheckoutCompleted(session);

    return {
      status: 'paid',
      message: 'Payment verified and enrollment completed',
      enrolled: true,
    };
  }
}

export const paymentService = new PaymentService();
