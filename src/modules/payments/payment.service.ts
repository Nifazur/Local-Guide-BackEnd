import { PrismaClient, UserRole, BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import stripe from '../../config/stripe';
import config from '../../config';
import ApiError from '../../utils/ApiError';
import { getPagination, getPaginationMeta } from '../../utils/helpers';
import { IPaymentFilters, IPayment, IPaginationMeta } from '../../types';

const prisma = new PrismaClient();

interface PaymentsResult {
  payments: IPayment[];
  pagination: IPaginationMeta;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  payment: IPayment;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  refunded: number;
  failed: number;
  totalRevenue: number;
}

export const createPaymentIntent = async (
  userId: string,
  bookingId: string
): Promise<PaymentIntentResult> => {
  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      payment: true,
    },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Check if user is the tourist
  if (booking.touristId !== userId) {
    throw ApiError.forbidden('You can only pay for your own bookings');
  }

  // Check booking status
  if (booking.status !== BookingStatus.CONFIRMED) {
    throw ApiError.badRequest('Booking must be confirmed before payment');
  }

  // Check if already paid
  if (booking.payment && booking.payment.status === PaymentStatus.PAID) {
    throw ApiError.conflict('This booking has already been paid');
  }

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalAmount * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      bookingId: booking.id,
      userId: userId,
      listingId: booking.listingId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Create or update payment record
  const payment = await prisma.payment.upsert({
    where: { bookingId: bookingId },
    update: {
      stripePaymentId: paymentIntent.id,
      amount: booking.totalAmount,
      status: PaymentStatus.PENDING,
    },
    create: {
      userId: userId,
      bookingId: bookingId,
      amount: booking.totalAmount,
      stripePaymentId: paymentIntent.id,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount: booking.totalAmount,
    payment: payment as unknown as IPayment,
  };
};

export const createCheckoutSession = async (
  userId: string,
  bookingId: string
): Promise<CheckoutSessionResult> => {
  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guide: true,
      payment: true,
    },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Check if user is the tourist
  if (booking.touristId !== userId) {
    throw ApiError.forbidden('You can only pay for your own bookings');
  }

  // Check booking status
  if (booking.status !== BookingStatus.CONFIRMED) {
    throw ApiError.badRequest('Booking must be confirmed before payment');
  }

  // Check if already paid
  if (booking.payment && booking.payment.status === PaymentStatus.PAID) {
    throw ApiError.conflict('This booking has already been paid');
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: booking.listing.title,
            description: `Tour with ${booking.guide.name} on ${new Date(booking.bookingDate).toLocaleDateString()}`,
            images: booking.listing.images.length > 0 ? [booking.listing.images[0]] : [],
          },
          unit_amount: Math.round(booking.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      userId: userId,
    },
    success_url: `${config.frontendUrl}/dashboard/bookings/${booking.id}?payment=success`,
    cancel_url: `${config.frontendUrl}/dashboard/bookings/${booking.id}?payment=cancelled`,
  });

  // Create or update payment record
  await prisma.payment.upsert({
    where: { bookingId: bookingId },
    update: {
      stripeSessionId: session.id,
      amount: booking.totalAmount,
      status: PaymentStatus.PENDING,
    },
    create: {
      userId: userId,
      bookingId: bookingId,
      amount: booking.totalAmount,
      stripeSessionId: session.id,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
};

export const confirmPayment = async (
  userId: string,
  bookingId: string,
  paymentIntentId: string
): Promise<IPayment> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.touristId !== userId) {
    throw ApiError.forbidden('Unauthorized');
  }

  // Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  console.log(paymentIntent)

  if (paymentIntent.status !== 'succeeded') {
    throw ApiError.badRequest('Payment has not been completed');
  }

  // Update payment status
  const payment = await prisma.payment.update({
    where: { bookingId: bookingId },
    data: {
      status: PaymentStatus.PAID,
      paymentMethod: paymentIntent.payment_method_types[0],
    },
  });

  return payment as unknown as IPayment;
};

export const handleWebhook = async (
  payload: Buffer,
  signature: string
): Promise<{ received: boolean }> => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch (err) {
    const error = err as Error;
    throw ApiError.badRequest(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) return;

  await prisma.payment.update({
    where: { bookingId: bookingId },
    data: {
      status: PaymentStatus.PAID,
      stripePaymentId: paymentIntent.id,
      paymentMethod: paymentIntent.payment_method_types[0],
    },
  });
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) return;

  await prisma.payment.update({
    where: { bookingId: bookingId },
    data: {
      status: PaymentStatus.FAILED,
    },
  });
};

const handleCheckoutComplete = async (session: Stripe.Checkout.Session): Promise<void> => {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.error('No bookingId found in session metadata');
    return;
  }

  try {
    // Update payment status
    await prisma.payment.update({
      where: { bookingId: bookingId },
      data: {
        status: PaymentStatus.PAID,
        stripeSessionId: session.id,
        paymentMethod: session.payment_method_types?.[0] || 'card',
        stripePaymentId: session.payment_intent as string,
      },
    });

    console.log(`Payment updated successfully for booking ${bookingId}`);
  } catch (error) {
    console.error('Error updating payment:', error);
  }
};

export const getPayments = async (
  userId: string,
  userRole: UserRole,
  filters: IPaymentFilters
): Promise<PaymentsResult> => {
  const { page = 1, limit = 10, status } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.PaymentWhereInput = {};

  // Filter by role
  if (userRole === UserRole.TOURIST) {
    where.userId = userId;
  } else if (userRole === UserRole.GUIDE) {
    where.booking = {
      guideId: userId,
    };
  }
  // Admin sees all

  if (status) {
    where.status = status;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            bookingDate: true,
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
            tourist: {
              select: {
                id: true,
                name: true,
              },
            },
            guide: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments as unknown as IPayment[],
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getPaymentById = async (
  paymentId: string,
  userId: string,
  userRole: UserRole
): Promise<IPayment> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          tourist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          guide: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  // Authorization check
  if (
    userRole !== UserRole.ADMIN &&
    payment.userId !== userId &&
    payment.booking.guideId !== userId
  ) {
    throw ApiError.forbidden('You do not have access to this payment');
  }

  return payment as unknown as IPayment;
};

export const refundPayment = async (
  paymentId: string,
  userId: string,
  userRole: UserRole,
  reason?: string
): Promise<IPayment> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: true,
    },
  });

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  // Only admin can refund
  if (userRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('Only admin can process refunds');
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw ApiError.badRequest('Can only refund paid payments');
  }

  // Process refund with Stripe
  if (payment.stripePaymentId) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        reason: 'requested_by_customer',
      });
    } catch (error) {
      const err = error as Error;
      throw ApiError.badRequest(`Stripe refund failed: ${err.message}`);
    }
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.REFUNDED },
  });

  // Cancel the booking
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return updatedPayment as unknown as IPayment;
};

export const getPaymentStats = async (
  userId: string,
  userRole: UserRole
): Promise<PaymentStats> => {
  const where: Prisma.PaymentWhereInput = {};

  if (userRole === UserRole.GUIDE) {
    where.booking = { guideId: userId };
  } else if (userRole === UserRole.TOURIST) {
    where.userId = userId;
  }

  const [total, paid, pending, refunded, failed] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.PAID } }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.REFUNDED } }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.FAILED } }),
  ]);

  // Calculate total revenue
  const revenue = await prisma.payment.aggregate({
    where: { ...where, status: PaymentStatus.PAID },
    _sum: { amount: true },
  });

  return {
    total,
    paid,
    pending,
    refunded,
    failed,
    totalRevenue: revenue._sum.amount || 0,
  };
};
export const getPaymentByBookingId = async (bookingId: string): Promise<IPayment | null> => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          listing: true,
        },
      },
    },
  });

  return payment as unknown as IPayment;
};