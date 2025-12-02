import { PrismaClient, UserRole, BookingStatus, PaymentStatus } from '@prisma/client';
import { IAdminStats, IGuideStats, ITouristStats } from '../../types';

const prisma = new PrismaClient();

interface AdminDashboardData {
  stats: IAdminStats;
  recentBookings: object[];
  recentUsers: object[];
  topGuides: object[];
}

interface GuideDashboardData {
  stats: IGuideStats;
  upcomingBookings: object[];
  recentReviews: object[];
}

interface TouristDashboardData {
  stats: ITouristStats;
  upcomingTrips: object[];
  pastTrips: object[];
}

export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  const [
    totalUsers,
    totalGuides,
    totalTourists,
    totalListings,
    totalBookings,
    pendingBookings,
    completedBookings,
    totalRevenue,
    recentBookings,
    recentUsers,
    topGuides,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.GUIDE } }),
    prisma.user.count({ where: { role: UserRole.TOURIST } }),
    prisma.listing.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tourist: { select: { id: true, name: true, profilePic: true } },
        guide: { select: { id: true, name: true, profilePic: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profilePic: true,
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.GUIDE },
      take: 5,
      orderBy: {
        reviewsReceived: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        profilePic: true,
        city: true,
        _count: {
          select: {
            reviewsReceived: true,
            bookingsAsGuide: { where: { status: BookingStatus.COMPLETED } },
          },
        },
      },
    }),
  ]);

  // Calculate average ratings for top guides
  const topGuidesWithRating = await Promise.all(
    topGuides.map(async (guide) => {
      const avgRating = await prisma.review.aggregate({
        where: { guideId: guide.id },
        _avg: { rating: true },
      });
      return {
        ...guide,
        averageRating: avgRating._avg.rating || 0,
      };
    })
  );

  return {
    stats: {
      totalUsers,
      totalGuides,
      totalTourists,
      totalListings,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
    recentBookings,
    recentUsers,
    topGuides: topGuidesWithRating,
  };
};

export const getGuideDashboard = async (guideId: string): Promise<GuideDashboardData> => {
  const [
    totalListings,
    activeListings,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    totalEarnings,
    totalReviews,
    avgRating,
    upcomingBookings,
    recentReviews,
  ] = await Promise.all([
    prisma.listing.count({ where: { guideId } }),
    prisma.listing.count({ where: { guideId, isActive: true } }),
    prisma.booking.count({ where: { guideId } }),
    prisma.booking.count({ where: { guideId, status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { guideId, status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { guideId, status: BookingStatus.COMPLETED } }),
    prisma.payment.aggregate({
      where: {
        booking: { guideId },
        status: PaymentStatus.PAID,
      },
      _sum: { amount: true },
    }),
    prisma.review.count({ where: { guideId } }),
    prisma.review.aggregate({
      where: { guideId },
      _avg: { rating: true },
    }),
    prisma.booking.findMany({
      where: {
        guideId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        bookingDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { bookingDate: 'asc' },
      include: {
        tourist: { select: { id: true, name: true, profilePic: true, phone: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
    prisma.review.findMany({
      where: { guideId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tourist: { select: { id: true, name: true, profilePic: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    stats: {
      totalListings,
      activeListings,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalEarnings: totalEarnings._sum.amount || 0,
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
    },
    upcomingBookings,
    recentReviews,
  };
};

export const getTouristDashboard = async (touristId: string): Promise<TouristDashboardData> => {
  const [
    totalBookings,
    upcomingBookingsCount,
    completedBookings,
    totalSpent,
    reviewsGiven,
    upcomingTrips,
    pastTrips,
  ] = await Promise.all([
    prisma.booking.count({ where: { touristId } }),
    prisma.booking.count({
      where: {
        touristId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        bookingDate: { gte: new Date() },
      },
    }),
    prisma.booking.count({ where: { touristId, status: BookingStatus.COMPLETED } }),
    prisma.payment.aggregate({
      where: { userId: touristId, status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.review.count({ where: { touristId } }),
    prisma.booking.findMany({
      where: {
        touristId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        bookingDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { bookingDate: 'asc' },
      include: {
        guide: { select: { id: true, name: true, profilePic: true, phone: true } },
        listing: { select: { id: true, title: true, images: true, city: true } },
        payment: { select: { status: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        touristId,
        status: BookingStatus.COMPLETED,
      },
      take: 5,
      orderBy: { bookingDate: 'desc' },
      include: {
        guide: { select: { id: true, name: true, profilePic: true } },
        listing: { select: { id: true, title: true, images: true, city: true } },
        review: true,
      },
    }),
  ]);

  return {
    stats: {
      totalBookings,
      upcomingBookings: upcomingBookingsCount,
      completedBookings,
      totalSpent: totalSpent._sum.amount || 0,
      reviewsGiven,
    },
    upcomingTrips,
    pastTrips,
  };
};