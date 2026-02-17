import { prisma } from '@sigma/db';
import type { CreatePaymentInput } from '../schemas/course.schema.js';

export class PaymentService {
    /**
     * Create a payment record (stub — Stripe integration later)
     */
    async createCheckout(userId: string, input: CreatePaymentInput) {
        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: input.courseId },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        if (course.status !== 'PUBLISHED') {
            throw new Error('Course is not available for purchase');
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId: input.courseId },
            },
        });

        if (existing) {
            throw new Error('Already enrolled in this course');
        }

        // Create payment record (pending — Stripe webhook will confirm)
        const payment = await prisma.payment.create({
            data: {
                userId,
                courseId: input.courseId,
                amount: course.price,
                status: 'PENDING',
                // stripeId will be set after Stripe Checkout Session
            },
        });

        // TODO: Create Stripe Checkout Session and return URL
        // const session = await stripe.checkout.sessions.create({ ... })

        return {
            paymentId: payment.id,
            amount: payment.amount,
            // checkoutUrl: session.url (will be added with Stripe)
            message: 'Payment created (Stripe integration pending)',
        };
    }

    /**
     * Confirm payment and enroll user (will be called by Stripe webhook)
     */
    async confirmPayment(paymentId: string) {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Update payment status and create enrollment in a transaction
        return prisma.$transaction([
            prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'COMPLETED' },
            }),
            prisma.enrollment.create({
                data: {
                    userId: payment.userId,
                    courseId: payment.courseId,
                },
            }),
        ]);
    }
}

export const paymentService = new PaymentService();
