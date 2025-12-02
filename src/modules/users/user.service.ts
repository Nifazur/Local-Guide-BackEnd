import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import ApiError from '../../utils/ApiError';
import { getPagination, getPaginationMeta, sanitizeUser } from '../../utils/helpers';
import {
  IUserFilters,
  IGuideFilters,
  ISanitizedUser,
  IPaginationMeta,
  IUser,
} from '../../types';

const prisma = new PrismaClient();

interface UsersResult {
  users: Partial<ISanitizedUser>[];
  pagination: IPaginationMeta;
}

interface GuidesResult {
  guides: (Partial<ISanitizedUser> & { averageRating: number })[];
  pagination: IPaginationMeta;
}

export const getUsers = async (filters: IUserFilters): Promise<UsersResult> => {
  const { page = 1, limit = 10, role, search, city, isActive } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePic: true,
        bio: true,
        city: true,
        country: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getGuides = async (filters: IGuideFilters): Promise<GuidesResult> => {
  const {
    page = 1,
    limit = 10,
    city,
    country,
    language,
    expertise,
    minRate,
    maxRate,
    search,
  } = filters;
  const { skip } = getPagination(page, limit);

  const where: Prisma.UserWhereInput = {
    role: UserRole.GUIDE,
    isActive: true,
  };

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  if (country) {
    where.country = { contains: country, mode: 'insensitive' };
  }

  if (language) {
    where.languages = { has: language };
  }

  if (expertise) {
    where.expertise = { has: expertise };
  }

  if (minRate !== undefined || maxRate !== undefined) {
    where.dailyRate = {};
    if (minRate !== undefined) where.dailyRate.gte = minRate;
    if (maxRate !== undefined) where.dailyRate.lte = maxRate;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [guides, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        profilePic: true,
        bio: true,
        languages: true,
        expertise: true,
        dailyRate: true,
        city: true,
        country: true,
        isVerified: true,
        _count: {
          select: {
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate average rating for each guide
  const guidesWithRating = await Promise.all(
    guides.map(async (guide) => {
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
    guides: guidesWithRating,
    pagination: getPaginationMeta(total, page, limit),
  };
};

export const getUserById = async (userId: string): Promise<ISanitizedUser & { averageRating: number }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      listings: {
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      reviewsReceived: {
        take: 5,
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
          listings: true,
          bookingsAsGuide: { where: { status: 'COMPLETED' } },
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Calculate average rating
  const avgRating = await prisma.review.aggregate({
    where: { guideId: userId },
    _avg: { rating: true },
  });

  const sanitized = sanitizeUser(user as unknown as IUser)!;
  return {
    ...sanitized,
    listings: user.listings,
    reviewsReceived: user.reviewsReceived,
    _count: user._count,
    averageRating: avgRating._avg.rating || 0,
  } as ISanitizedUser & { averageRating: number };
};

export const updateUser = async (
  userId: string,
  updateData: Partial<IUser>,
  requestingUserId: string,
  requestingUserRole: UserRole
): Promise<ISanitizedUser> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check authorization
  if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  // Filter allowed fields based on role
  const allowedFields = ['name', 'bio', 'phone', 'languages', 'profilePic'];

  if (user.role === UserRole.GUIDE) {
    allowedFields.push('expertise', 'dailyRate', 'city', 'country');
  } else if (user.role === UserRole.TOURIST) {
    allowedFields.push('travelPreferences');
  }

  const filteredData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updateData[field as keyof typeof updateData] !== undefined) {
      filteredData[field] = updateData[field as keyof typeof updateData];
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
  });

  return sanitizeUser(updatedUser as unknown as IUser)!;
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<ISanitizedUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role === UserRole.ADMIN) {
    throw ApiError.forbidden('Cannot deactivate admin accounts');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  return sanitizeUser(updatedUser as unknown as IUser)!;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role === UserRole.ADMIN) {
    throw ApiError.forbidden('Cannot delete admin accounts');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
};