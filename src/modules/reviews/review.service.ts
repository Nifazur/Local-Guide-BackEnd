import { PrismaClient, UserRole, BookingStatus, Prisma } from '@prisma/client';
import ApiError from '../../utils/ApiError';
import { getPagination, getPaginationMeta } from '../../utils/helpers';
import { IReviewFilters, IReview, IPaginationMeta } from '../../types';

const prisma = new PrismaClient();

interface ReviewsResult {
  reviews: IReview[];
  pagination: IPaginationMeta;
}

interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment: string;
}

interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export const createReview = async (
  touristId: string,
  reviewData: CreateReviewInput
): Promise<IReview> => {
  const { bookingId, rating, comment } = reviewData;

  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      review: true,
    },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Check if user is the tourist
  if (booking.touristId !== touristId) {
    throw ApiError.forbidden('You can only review your own bookings');
  }

  // Check if booking is completed
  if (booking.status !== BookingStatus.COMPLETED) {
    throw ApiError.badRequest('You can only review completed tours');
  }

  // Check if already reviewed
  if (booking.review) {
    throw ApiError.conflict('You have already reviewed this booking');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      touristId,
      guideId: booking.guideId,
      listingId: booking.listingId,
      bookingId,
      rating,
      comment,
    },
    include: {
      tourist: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
      guide: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
    },
  });

  return review as unknown as IReview;
};

export const getReviews = async (filters: IReviewFilters): Promise<ReviewsResult> => {
  const { page = 1, limit = 10, guideId, listingId, rating } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.ReviewWhereInput = {};

  if (guideId) {
    where.guideId = guideId;
  }

  if (listingId) {
    where.listingId = listingId;
  }

  if (rating) {
    where.rating = rating;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tourist: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        guide: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews as unknown as IReview[],
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getReviewById = async (reviewId: string): Promise<IReview> => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      tourist: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          images: true,
        },
      },
      guide: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
    },
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  return review as unknown as IReview;
};

export const updateReview = async (
  reviewId: string,
  touristId: string,
  updateData: UpdateReviewInput
): Promise<IReview> => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.touristId !== touristId) {
    throw ApiError.forbidden('You can only update your own reviews');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      tourist: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedReview as unknown as IReview;
};

export const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.touristId !== userId && userRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  return true;
};

export const getMyReviews = async (
  userId: string,
  filters: { page?: number; limit?: number }
): Promise<ReviewsResult> => {
  const { page = 1, limit = 10 } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.ReviewWhereInput = { touristId: userId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        guide: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews as unknown as IReview[],
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getGuideReviews = async (
  guideId: string,
  filters: { page?: number; limit?: number }
): Promise<ReviewsResult> => {
  const { page = 1, limit = 10 } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.ReviewWhereInput = { guideId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tourist: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews as unknown as IReview[],
    pagination: getPaginationMeta(total, page, limit),
  };
};