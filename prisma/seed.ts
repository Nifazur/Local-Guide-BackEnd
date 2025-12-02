import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@localguide.com' },
    update: {},
    create: {
      email: 'admin@localguide.com',
      password: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      isVerified: true,
      bio: 'Platform administrator',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create Sample Guide
  const guidePassword = await bcrypt.hash('guide123', 12);
  const guide = await prisma.user.upsert({
    where: { email: 'guide@localguide.com' },
    update: {},
    create: {
      email: 'guide@localguide.com',
      password: guidePassword,
      name: 'John Guide',
      role: UserRole.GUIDE,
      bio: 'Passionate local guide with 5 years of experience showing tourists the hidden gems of New York City.',
      languages: ['English', 'Spanish', 'French'],
      expertise: ['History', 'Food', 'Art', 'Nightlife'],
      dailyRate: 150,
      city: 'New York',
      country: 'USA',
      isVerified: true,
      phone: '+1234567890',
    },
  });
  console.log('✅ Guide created:', guide.email);

  // Create Second Guide
  const guide2Password = await bcrypt.hash('guide123', 12);
  const guide2 = await prisma.user.upsert({
    where: { email: 'guide2@localguide.com' },
    update: {},
    create: {
      email: 'guide2@localguide.com',
      password: guide2Password,
      name: 'Sarah Explorer',
      role: UserRole.GUIDE,
      bio: 'Adventure enthusiast and photography expert. Let me show you the best spots for amazing photos!',
      languages: ['English', 'German'],
      expertise: ['Photography', 'Adventure', 'Nature'],
      dailyRate: 120,
      city: 'Los Angeles',
      country: 'USA',
      isVerified: true,
      phone: '+1987654321',
    },
  });
  console.log('✅ Guide 2 created:', guide2.email);

  // Create Sample Tourist
  const touristPassword = await bcrypt.hash('tourist123', 12);
  const tourist = await prisma.user.upsert({
    where: { email: 'tourist@localguide.com' },
    update: {},
    create: {
      email: 'tourist@localguide.com',
      password: touristPassword,
      name: 'Jane Tourist',
      role: UserRole.TOURIST,
      bio: 'Adventure seeker and food lover. Always looking for authentic local experiences!',
      languages: ['English'],
      travelPreferences: ['Food', 'Adventure', 'Photography', 'Culture'],
      isVerified: true,
    },
  });
  console.log('✅ Tourist created:', tourist.email);

  // Create Sample Listings
  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        title: 'Hidden Jazz Bars of New York',
        description: 'Discover the secret jazz spots that only locals know about. Experience live music, great cocktails, and authentic NYC nightlife. Perfect for music lovers and those seeking unique evening entertainment.',
        itinerary: '7:00 PM - Meet at Times Square\n7:30 PM - First Jazz Bar (drinks included)\n9:00 PM - Second Location with live performance\n10:30 PM - Secret Speakeasy\n12:00 AM - Tour ends',
        tourFee: 85,
        duration: 5,
        meetingPoint: 'Times Square, NYC - Red Steps',
        maxGroupSize: 8,
        city: 'New York',
        country: 'USA',
        category: ['Nightlife', 'Music', 'Culture'],
        images: [
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
        ],
        guideId: guide.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'NYC Street Food Adventure',
        description: 'Taste your way through the best street food vendors in the city. From iconic hot dogs to authentic halal carts and hidden food gems. Experience the diverse flavors that make NYC a food paradise.',
        itinerary: '11:00 AM - Start at Central Park South\n11:30 AM - Classic NYC hot dog\n12:30 PM - Chinatown exploration\n2:00 PM - Little Italy desserts\n3:30 PM - Hidden gem food truck\n4:30 PM - Tour ends',
        tourFee: 65,
        duration: 6,
        meetingPoint: 'Central Park South Entrance',
        maxGroupSize: 10,
        city: 'New York',
        country: 'USA',
        category: ['Food', 'Culture', 'Walking'],
        images: [
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'
        ],
        guideId: guide.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Historical Walking Tour of Manhattan',
        description: 'Walk through centuries of history in the heart of Manhattan. Visit iconic landmarks, hear fascinating stories, and understand how NYC became the city it is today.',
        itinerary: '9:00 AM - Meet at Battery Park\n9:30 AM - Statue of Liberty views\n10:30 AM - Wall Street history\n12:00 PM - 9/11 Memorial\n1:30 PM - City Hall area\n3:00 PM - Tour ends',
        tourFee: 55,
        duration: 6,
        meetingPoint: 'Battery Park, NYC',
        maxGroupSize: 15,
        city: 'New York',
        country: 'USA',
        category: ['History', 'Walking', 'Culture'],
        images: [
          'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800',
          'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800'
        ],
        guideId: guide.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'LA Instagram Photography Tour',
        description: 'Capture the most Instagram-worthy spots in Los Angeles. From stunning murals to iconic landmarks, get amazing photos for your feed with expert guidance.',
        itinerary: '10:00 AM - Meet at Venice Beach\n10:30 AM - Beach photography\n12:00 PM - Arts District murals\n2:00 PM - Griffith Observatory\n4:00 PM - Hollywood Sign views\n5:30 PM - Tour ends',
        tourFee: 95,
        duration: 7,
        meetingPoint: 'Venice Beach Boardwalk',
        maxGroupSize: 6,
        city: 'Los Angeles',
        country: 'USA',
        category: ['Photography', 'Art', 'Culture'],
        images: [
          'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
          'https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=800'
        ],
        guideId: guide2.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Malibu Beach & Hiking Adventure',
        description: 'Experience the best of Malibu with stunning beach walks and scenic hiking trails. Perfect for nature lovers and adventure seekers.',
        itinerary: '8:00 AM - Meet at Malibu Pier\n8:30 AM - Coastal walk\n10:00 AM - Hiking trail\n12:30 PM - Beach picnic\n2:00 PM - Hidden cove exploration\n4:00 PM - Tour ends',
        tourFee: 110,
        duration: 8,
        meetingPoint: 'Malibu Pier Parking',
        maxGroupSize: 8,
        city: 'Los Angeles',
        country: 'USA',
        category: ['Adventure', 'Nature', 'Hiking'],
        images: [
          'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
        ],
        guideId: guide2.id,
      },
    }),
  ]);
  console.log('✅ Listings created:', listings.length);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });