import { PrismaClient, UserRole, BookingStatus, Prisma } from '@prisma/client';
import ApiError from '../../utils/ApiError';
import { getPagination, getPaginationMeta } from '../../utils/helpers';
import { IBookingFilters, IBooking, IPaginationMeta } from '../../types';

const prisma = new PrismaClient();

interface BookingsResult {
  bookings: IBooking[];
  pagination: IPaginationMeta;
}

interface CreateBookingInput {
  listingId: string;
  bookingDate: Date;
  startTime: string;
  numberOfPeople?: number;
  specialRequests?: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
}

export const createBooking = async (
  touristId: string,
  bookingData: CreateBookingInput
): Promise<IBooking> => {
  const { listingId, bookingDate, startTime, numberOfPeople = 1, specialRequests } = bookingData;

  // Get listing details
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { guide: true },
  });

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  if (!listing.isActive) {
    throw ApiError.badRequest('This tour is currently not available');
  }

  // Prevent booking own tour
  if (listing.guideId === touristId) {
    throw ApiError.badRequest('You cannot book your own tour');
  }

  // Check group size
  if (numberOfPeople > listing.maxGroupSize) {
    throw ApiError.badRequest(`Maximum group size is ${listing.maxGroupSize}`);
  }

  // Calculate total amount
  const totalAmount = listing.tourFee * numberOfPeople;

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      touristId,
      guideId: listing.guideId,
      listingId,
      bookingDate: new Date(bookingDate),
      startTime,
      numberOfPeople,
      totalAmount,
      specialRequests: specialRequests || null,
      status: BookingStatus.PENDING,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          tourFee: true,
          duration: true,
          meetingPoint: true,
          images: true,
        },
      },
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePic: true,
        },
      },
      tourist: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return booking as unknown as IBooking;
};

export const getBookings = async (
  userId: string,
  userRole: UserRole,
  filters: IBookingFilters
): Promise<BookingsResult> => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    startDate, 
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'     
  } = filters;
  
  const { skip } = getPagination(page, limit);

  const where: Prisma.BookingWhereInput = {};

  // Filter by role
  if (userRole === UserRole.TOURIST) {
    where.touristId = userId;
  } else if (userRole === UserRole.GUIDE) {
    where.guideId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.bookingDate = {};
    if (startDate) where.bookingDate.gte = new Date(startDate);
    if (endDate) where.bookingDate.lte = new Date(endDate);
  }

  // ✅ Dynamic orderBy
  const orderBy: Prisma.BookingOrderByWithRelationInput = {};
  if (sortBy === 'createdAt') {
    orderBy.createdAt = sortOrder;
  } else if (sortBy === 'bookingDate') {
    orderBy.bookingDate = sortOrder;
  } else if (sortBy === 'totalAmount') {
    orderBy.totalAmount = sortOrder;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy, // ✅ Dynamic sorting
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
            city: true,
          },
        },
        guide: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
        tourist: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings as unknown as IBooking[],
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getBookingById = async (
  bookingId: string,
  userId: string,
  userRole: UserRole
): Promise<IBooking> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          description: true,
          itinerary: true,
          tourFee: true,
          duration: true,
          meetingPoint: true,
          images: true,
          city: true,
          country: true,
        },
      },
      guide: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePic: true,
          languages: true,
        },
      },
      tourist: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePic: true,
        },
      },
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Check authorization
  if (
    userRole !== UserRole.ADMIN &&
    booking.touristId !== userId &&
    booking.guideId !== userId
  ) {
    throw ApiError.forbidden('You do not have access to this booking');
  }

  return booking as unknown as IBooking;
};

export const updateBookingStatus = async (
  bookingId: string,
  status: 'CONFIRMED' | 'CANCELLED',
  userId: string,
  userRole: UserRole
): Promise<IBooking> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Authorization checks
  if (status === 'CONFIRMED') {
    // Only guide can confirm
    if (booking.guideId !== userId && userRole !== UserRole.ADMIN) {
      throw ApiError.forbidden('Only the guide can confirm this booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw ApiError.badRequest('Can only confirm pending bookings');
    }
  }

  if (status === 'CANCELLED') {
    // Tourist, guide, or admin can cancel
    if (
      booking.touristId !== userId &&
      booking.guideId !== userId &&
      userRole !== UserRole.ADMIN
    ) {
      throw ApiError.forbidden('You cannot cancel this booking');
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot cancel completed bookings');
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as BookingStatus },
    include: {
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
          email: true,
        },
      },
      tourist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedBooking as unknown as IBooking;
};

export const completeBooking = async (
  bookingId: string,
  userId: string,
  userRole: UserRole
): Promise<IBooking> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Only guide or admin can complete
  if (booking.guideId !== userId && userRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('Only the guide can complete this booking');
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw ApiError.badRequest('Can only complete confirmed bookings');
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.COMPLETED },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedBooking as unknown as IBooking;
};

export const getBookingStats = async (
  userId: string,
  userRole: UserRole
): Promise<BookingStats> => {
  const where: Prisma.BookingWhereInput = {};

  if (userRole === UserRole.GUIDE) {
    where.guideId = userId;
  } else if (userRole === UserRole.TOURIST) {
    where.touristId = userId;
  }

  const [total, pending, confirmed, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { ...where, status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { ...where, status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { ...where, status: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { ...where, status: BookingStatus.CANCELLED } }),
  ]);

  // Calculate total earnings for guides
  let totalEarnings = 0;
  if (userRole === UserRole.GUIDE) {
    const earnings = await prisma.booking.aggregate({
      where: { ...where, status: BookingStatus.COMPLETED },
      _sum: { totalAmount: true },
    });
    totalEarnings = earnings._sum.totalAmount || 0;
  }

  return {
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    totalEarnings,
  };
};