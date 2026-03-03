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
  couponCode?: string;
}

interface AdminOrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'amount-asc' | 'amount-desc';
}

export class PaymentService {
  /**
   * List all payments for admin with filtering, search, and pagination
   */
  async listForAdmin(query: AdminOrderQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { course: { title: { contains: query.search, mode: 'insensitive' } } },
        { id: { contains: query.search, mode: 'insensitive' } },
        { stripeId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (query.sort === 'amount-asc') orderBy = { amount: 'asc' };
    else if (query.sort === 'amount-desc') orderBy = { amount: 'desc' };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, profileImage: true } },
          course: { select: { id: true, title: true, slug: true, thumbnail: true } },
          coupon: { select: { id: true, code: true, discountType: true, discountValue: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Summary stats
    const [totalRevenue, statusCounts] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const summary = {
      totalRevenue: totalRevenue._sum.amount || 0,
      statusCounts: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      summary,
    };
  }

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

    // 🌟 1. Calculate base total
    let totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    let discountAmount = 0;
    let couponId: string | null = null;
    let eligibleTotalAmount = totalAmount;
    let eligibleCourseIds = new Set(items.map((i) => i.courseId));

    // 🌟 2. Handle Coupon Validation
    if (input.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: input.couponCode,
          isActive: true,
          deletedAt: null,
          startDate: { lte: new Date() },
        },
        include: {
          applicableCourses: { select: { id: true } },
        },
      });

      if (coupon) {
        let isValid = true;
        if (coupon.endDate && new Date() > coupon.endDate) isValid = false;
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) isValid = false;
        if (coupon.minPurchase && totalAmount < coupon.minPurchase) isValid = false;

        if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
          const applicableIds = coupon.applicableCourses.map((c) => c.id);
          const eligible = items.filter((i) => applicableIds.includes(i.courseId));
          if (eligible.length === 0) isValid = false;
          else {
            eligibleCourseIds = new Set(eligible.map((i) => i.courseId));
            eligibleTotalAmount = eligible.reduce((sum, item) => sum + item.price, 0);
          }
        }

        if (isValid) {
          couponId = coupon.id;
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (eligibleTotalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          if (discountAmount > eligibleTotalAmount) discountAmount = eligibleTotalAmount;
        }
      }
    }

    // Build Stripe line items (price in satang = THB * 100)
    // Proportionally distribute the discount across eligible items only
    const discountRatio = eligibleTotalAmount > 0 ? discountAmount / eligibleTotalAmount : 0;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      let finalPrice = item.price;
      if (couponId && eligibleCourseIds.has(item.courseId)) {
        const itemDiscount = item.price * discountRatio;
        finalPrice = Math.max(0, item.price - itemDiscount);
      }

      return {
        price_data: {
          currency: 'thb',
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(finalPrice * 100), // Convert THB to satang
        },
        quantity: 1,
      };
    });

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
        couponId: couponId || '',
      },
    });

    // Create payment records for each course
    for (const item of items) {
      let finalPrice = item.price;
      if (couponId && eligibleCourseIds.has(item.courseId)) {
        const itemDiscount = item.price * discountRatio;
        finalPrice = Math.max(0, item.price - itemDiscount);
      }

      await prisma.payment.create({
        data: {
          userId,
          courseId: item.courseId,
          amount: finalPrice,
          status: 'PENDING',
          stripeId: session.id,
          couponId: couponId,
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
