import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import ApiError from '../../utils/ApiError';
import { getPagination, getPaginationMeta } from '../../utils/helpers';
import { IListingFilters, IListing, IPaginationMeta } from '../../types';

const prisma = new PrismaClient();

interface ListingsResult {
  listings: (IListing & { averageRating: number })[];
  pagination: IPaginationMeta;
}

interface CreateListingInput {
  title: string;
  description: string;
  itinerary?: string;
  tourFee: number;
  duration: number;
  meetingPoint: string;
  maxGroupSize: number;
  city: string;
  country: string;
  category: string[];
  images?: string[];
}

export const createListing = async (
  guideId: string,
  listingData: CreateListingInput
): Promise<IListing> => {
  // Verify user is a guide
  const guide = await prisma.user.findUnique({
    where: { id: guideId },
  });

  if (!guide || guide.role !== UserRole.GUIDE) {
    throw ApiError.forbidden('Only guides can create listings');
  }

  const listing = await prisma.listing.create({
    data: {
      ...listingData,
      images: listingData.images || [],
      guideId,
    },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          languages: true,
        },
      },
    },
  });

  return listing as unknown as IListing;
};

export const getListings = async (filters: IListingFilters): Promise<ListingsResult> => {
  const {
    page = 1,
    limit = 10,
    city,
    country,
    category,
    minPrice,
    maxPrice,
    duration,
    search,
    guideId,
    sortBy = 'newest',
  } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.ListingWhereInput = {
    isActive: true,
  };

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  if (country) {
    where.country = { contains: country, mode: 'insensitive' };
  }

  if (category) {
    where.category = { has: category };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.tourFee = {};
    if (minPrice !== undefined) where.tourFee.gte = minPrice;
    if (maxPrice !== undefined) where.tourFee.lte = maxPrice;
  }

  if (duration) {
    where.duration = { lte: duration };
  }

  if (guideId) {
    where.guideId = guideId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Determine sort order
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'price') {
    orderBy = { tourFee: 'asc' };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            languages: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Calculate average rating for each listing
  const listingsWithRating = await Promise.all(
    listings.map(async (listing) => {
      const avgRating = await prisma.review.aggregate({
        where: { listingId: listing.id },
        _avg: { rating: true },
      });
      return {
        ...listing,
        averageRating: avgRating._avg.rating || 0,
      };
    })
  );

  // Sort by rating if needed
  if (sortBy === 'rating') {
    listingsWithRating.sort((a, b) => b.averageRating - a.averageRating);
  }

  return {
    listings: listingsWithRating as unknown as (IListing & { averageRating: number })[],
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getListingById = async (listingId: string): Promise<IListing & { averageRating: number }> => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          bio: true,
          languages: true,
          expertise: true,
          isVerified: true,
          _count: {
            select: {
              listings: true,
              reviewsReceived: true,
            },
          },
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tourist: {
            select: {
              id: true,
              name: true,
              profilePic: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  // Calculate average rating
  const avgRating = await prisma.review.aggregate({
    where: { listingId },
    _avg: { rating: true },
  });

  // Calculate guide's average rating
  const guideAvgRating = await prisma.review.aggregate({
    where: { guideId: listing.guideId },
    _avg: { rating: true },
  });

  return {
    ...listing,
    averageRating: avgRating._avg.rating || 0,
    guide: {
      ...listing.guide,
      averageRating: guideAvgRating._avg.rating || 0,
    },
  } as unknown as IListing & { averageRating: number };
};

export const updateListing = async (
  listingId: string,
  guideId: string,
  updateData: Partial<CreateListingInput & { isActive: boolean }>,
  userRole: UserRole
): Promise<IListing> => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  // Check authorization
  if (listing.guideId !== guideId && userRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('You can only update your own listings');
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: {
      guide: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
    },
  });

  return updatedListing as unknown as IListing;
};

export const deleteListing = async (
  listingId: string,
  guideId: string,
  userRole: UserRole
): Promise<boolean> => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  // Check authorization
  if (listing.guideId !== guideId && userRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('You can only delete your own listings');
  }

  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      listingId,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });

  if (activeBookings > 0) {
    throw ApiError.badRequest('Cannot delete listing with active bookings');
  }

  await prisma.listing.delete({
    where: { id: listingId },
  });

  return true;
};

export const getMyListings = async (
  guideId: string,
  filters: { page?: number; limit?: number }
): Promise<ListingsResult> => {
  const { page = 1, limit = 10 } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.ListingWhereInput = { guideId };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Calculate average rating for each listing
  const listingsWithRating = await Promise.all(
    listings.map(async (listing) => {
      const avgRating = await prisma.review.aggregate({
        where: { listingId: listing.id },
        _avg: { rating: true },
      });
      return {
        ...listing,
        averageRating: avgRating._avg.rating || 0,
      };
    })
  );

  return {
    listings: listingsWithRating as unknown as (IListing & { averageRating: number })[],
    pagination: getPaginationMeta(total, page, limit),
  };
};