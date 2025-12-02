import { UserRole, BookingStatus, PaymentStatus } from '@prisma/client';

// User Types
export interface IUser {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  profilePic?: string | null;
  bio?: string | null;
  languages: string[];
  phone?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expertise: string[];
  dailyRate?: number | null;
  city?: string | null;
  country?: string | null;
  travelPreferences: string[];
}

export interface ISanitizedUser extends Omit<IUser, 'password'> {}

export interface ITokenPayload {
  id: string;
  role: UserRole;
}

// Listing Types
export interface IListing {
  id: string;
  title: string;
  description: string;
  itinerary?: string | null;
  tourFee: number;
  duration: number;
  meetingPoint: string;
  maxGroupSize: number;
  images: string[];
  city: string;
  country: string;
  category: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  guideId: string;
}

// Booking Types
export interface IBooking {
  id: string;
  bookingDate: Date;
  startTime: string;
  endTime?: string | null;
  numberOfPeople: number;
  totalAmount: number;
  status: BookingStatus;
  specialRequests?: string | null;
  createdAt: Date;
  updatedAt: Date;
  touristId: string;
  guideId: string;
  listingId: string;
}

// Review Types
export interface IReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  touristId: string;
  guideId: string;
  listingId: string;
  bookingId: string;
}

// Payment Types
export interface IPayment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string | null;
  stripeSessionId?: string | null;
  paymentMethod?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  bookingId: string;
}

// Pagination Types
export interface IPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Filter Types
export interface IListingFilters {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  search?: string;
  guideId?: string;
  sortBy?: 'price' | 'rating' | 'newest';
}

export interface IUserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  city?: string;
  isActive?: boolean;
}

export interface IGuideFilters {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  language?: string;
  expertise?: string;
  minRate?: number;
  maxRate?: number;
  search?: string;
}

export interface IBookingFilters {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface IReviewFilters {
  page?: number;
  limit?: number;
  guideId?: string;
  listingId?: string;
  rating?: number;
}

export interface IPaymentFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

// API Response Types
export interface IApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    pagination?: IPaginationMeta;
  };
}

// Auth Types
export interface IRegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  languages?: string[];
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: ISanitizedUser;
  token: string;
}

// Cloudinary Types
export interface ICloudinaryResult {
  url: string;
  publicId: string;
}

// Dashboard Stats Types
export interface IAdminStats {
  totalUsers: number;
  totalGuides: number;
  totalTourists: number;
  totalListings: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

export interface IGuideStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalEarnings: number;
  totalReviews: number;
  averageRating: number;
}

export interface ITouristStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
  reviewsGiven: number;
}