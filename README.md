# Local Guide Platform - Backend API

A comprehensive RESTful API for the Local Guide Platform, connecting travelers with local guides for authentic experiences.

## 🚀 Features

- **User Authentication & Authorization** (JWT-based)
- **Role-based Access Control** (Tourist, Guide, Admin)
- **Tour Listing Management** (CRUD operations)
- **Booking System** (Request, Confirm, Complete, Cancel)
- **Review & Rating System**
- **Payment Integration** (Stripe)
- **Image Upload** (Cloudinary)
- **Search & Filtering**
- **Dashboard Analytics**

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Payment:** Stripe
- **File Upload:** Cloudinary, Multer
- **Validation:** Joi
- **Security:** Helmet, bcryptjs, CORS
- **Language:** TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Stripe Account (for payment processing)
- Cloudinary Account (for image uploads)

## 🔧 Installation

### 1. Clone the repository

```bash

git clone <repository-url>

cd backend

```

### 2. Install dependencies

```bash

npm install

```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env

# Database

DATABASE_URL="postgresql://user:password@localhost:5432/local_guide"


# JWT Configuration

JWT_SECRET="your-super-secret-jwt-key-change-in-production"

JWT_EXPIRES_IN="7d"

JWT_COOKIE_EXPIRES_IN="7"


# Cloudinary Configuration

CLOUDINARY_CLOUD_NAME="your-cloud-name"

CLOUDINARY_API_KEY="your-cloudinary-api-key"

CLOUDINARY_API_SECRET="your-cloudinary-api-secret"


# Stripe Configuration

STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"

STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"


# Application Configuration

NODE_ENV="development"

PORT="5000"

FRONTEND_URL="http://localhost:3000"

```

### 4. Database Setup

#### Generate Prisma Client

```bash

npm run prisma:generate

```

#### Run Migrations

```bash

npm run prisma:migrate

```

#### Seed Database (Optional)

```bash

npm run prisma:seed

```

This will create:

- 1 Admin user
- 2 Guide users
- 1 Tourist user
- 5 Sample tour listings

**Default Credentials:**

- **Admin:**`admin@localguide.com` / `******`
- **Guide:**`guide@localguide.com` / `guide123`
- **Tourist:**`tourist@localguide.com` / `tourist123`

## 🚀 Running the Application

### Development Mode

```bash

npm run dev

```

Server runs on `http://localhost:5000`

### Production Build

```bash

npm run build

npm start

```

### Other Commands

```bash

# Prisma Studio (Database GUI)

npm run prisma:studio


# Reset Database

npm run prisma:reset


# Run Type Check

npm run typecheck


# Run Linter

npm run lint

```

## 📁 Project Structure

```

backend/

├── prisma/

│   ├── migrations/          # Database migrations

│   ├── schema.prisma        # Database schema

│   └── seed.ts             # Seed data

├── src/

│   ├── config/             # Configuration files

│   │   ├── index.ts        # Main config

│   │   ├── cloudinary.ts   # Cloudinary setup

│   │   └── stripe.ts       # Stripe setup

│   ├── middleware/         # Express middlewares

│   │   ├── auth.ts         # Authentication

│   │   ├── authorize.ts    # Authorization

│   │   ├── errorHandler.ts

│   │   ├── upload.ts       # File upload

│   │   └── validate.ts     # Request validation

│   ├── modules/           # Feature modules

│   │   ├── auth/

│   │   ├── users/

│   │   ├── listings/

│   │   ├── bookings/

│   │   ├── reviews/

│   │   ├── payments/

│   │   ├── dashboard/

│   │   └── uploads/

│   ├── routes/            # API routes

│   ├── types/             # TypeScript types

│   ├── utils/             # Utility functions

│   ├── app.ts             # Express app setup

│   └── server.ts          # Server entry point

├── uploads/               # Temporary upload directory

├── .env                   # Environment variables

├── .env.example           # Environment template

├── package.json

└── tsconfig.json

```

## 🔐 Authentication Flow

1. **Register:**`POST /api/auth/register`

   - User creates an account (Tourist/Guide)
   - Password is hashed with bcrypt
   - JWT token is returned
2. **Login:**`POST /api/auth/login`

   - User logs in with email/password
   - JWT token is returned
   - Token is stored in HTTP-only cookie
3. **Protected Routes:**

   - Include JWT token in `Authorization: Bearer <token>` header
   - Or token from HTTP-only cookie

## 📡 API Endpoints

### Authentication

```

POST   /api/auth/register        - Register new user

POST   /api/auth/login           - Login user

POST   /api/auth/logout          - Logout user

GET    /api/auth/me              - Get current user

PATCH  /api/auth/change-password - Change password

```

### Users

```

GET    /api/users                - Get all users (Admin)

GET    /api/users/guides         - Get all guides (Public)

GET    /api/users/:id            - Get user by ID

PATCH  /api/users/:id            - Update user

PATCH  /api/users/:id/status     - Update user status (Admin)

DELETE /api/users/:id            - Delete user (Admin)

```

### Listings

```

GET    /api/listings             - Get all listings (Public)

GET    /api/listings/:id         - Get listing by ID

GET    /api/listings/my/listings - Get my listings (Guide)

POST   /api/listings             - Create listing (Guide)

PATCH  /api/listings/:id         - Update listing (Guide)

DELETE /api/listings/:id         - Delete listing (Guide)

```

### Bookings

```

GET    /api/bookings             - Get bookings

GET    /api/bookings/:id         - Get booking by ID

GET    /api/bookings/stats       - Get booking stats

POST   /api/bookings             - Create booking (Tourist)

PATCH  /api/bookings/:id/status  - Update booking status

PATCH  /api/bookings/:id/complete - Complete booking (Guide)

```

### Reviews

```

GET    /api/reviews              - Get all reviews (Public)

GET    /api/reviews/:id          - Get review by ID

GET    /api/reviews/guide/:id    - Get guide reviews

GET    /api/reviews/my/reviews   - Get my reviews (Tourist)

POST   /api/reviews              - Create review (Tourist)

PATCH  /api/reviews/:id          - Update review (Tourist)

DELETE /api/reviews/:id          - Delete review

```

### Payments

```

GET    /api/payments             - Get payments

GET    /api/payments/:id         - Get payment by ID

GET    /api/payments/stats       - Get payment stats

POST   /api/payments/create-payment-intent    - Create payment intent

POST   /api/payments/create-checkout-session  - Create checkout session

POST   /api/payments/confirm     - Confirm payment

POST   /api/payments/:id/refund  - Refund payment (Admin)

POST   /api/payments/webhook     - Stripe webhook

```

### Dashboard

```

GET    /api/dashboard            - Get dashboard (Role-based)

GET    /api/dashboard/admin      - Admin dashboard

GET    /api/dashboard/guide      - Guide dashboard

GET    /api/dashboard/tourist    - Tourist dashboard

```

### Uploads

```

POST   /api/uploads/single       - Upload single image

POST   /api/uploads/multiple     - Upload multiple images

DELETE /api/uploads               - Delete image

```

## 📊 Database Schema

### Main Tables

- **User** - User accounts (Tourist, Guide, Admin)
- **Listing** - Tour listings
- **Booking** - Tour bookings
- **Review** - Tour reviews
- **Payment** - Payment records

### Relationships

- User → Listings (1:N)
- User → Bookings as Tourist (1:N)
- User → Bookings as Guide (1:N)
- Listing → Bookings (1:N)
- Booking → Payment (1:1)
- Booking → Review (1:1)

## 🔒 Security Features

- **Password Hashing:** bcrypt (12 rounds)
- **JWT Authentication:** Secure token-based auth
- **Rate Limiting:** 100 requests per 15 minutes
- **CORS:** Configured for frontend domain
- **Helmet:** Security headers
- **Input Validation:** Joi validation
- **SQL Injection Prevention:** Prisma ORM
- **XSS Protection:** Sanitized inputs

## 💳 Payment Integration

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Set webhook endpoint: `https://your-api.com/api/payments/webhook`
4. Add webhook secret to `.env`

### Payment Flow

1. Tourist requests booking
2. Guide confirms booking
3. Tourist creates checkout session
4. Stripe processes payment
5. Webhook updates payment status
6. Booking is confirmed

## 📤 File Upload

### Cloudinary Setup

1. Create Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get cloud name and API credentials
3. Add to `.env` file

### Upload Flow

- Images are temporarily stored in `uploads/`
- Uploaded to Cloudinary
- URL is returned
- Temporary file is deleted

## 🧪 Testing

### Manual Testing with Postman

Import the `postman.json` collection provided in the root directory.

### Test Accounts

```

Admin:   admin@localguide.com   / ******

Guide:   guide@localguide.com   / guide123

Tourist: tourist@localguide.com / tourist123

```

## 🐛 Error Handling

All errors return standardized JSON responses:

```json

{

"success":false,

"message":"Error message",

"errors":[

{

"field":"email",

"message":"Email is required"

}

]

}

```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🚀 Deployment

### Recommended Platforms

- **Railway** (Recommended for PostgreSQL + API)
- **Render** (Free tier available)
- **Heroku**
- **AWS/DigitalOcean**

### Deployment Steps

1. **Set Environment Variables**

   - Add all `.env` variables to your hosting platform
2. **Database Migration**

   ```bash

   npm run prisma:migrate:prod

   ```

```


3. **Build Application**

   ```bash

   npm run build

```

4. **Start Server**

   ```bash

   npm start

   ```

```


## 🤝 Contributing


1. Fork the repository

2. Create a feature branch (`git checkout -b feature/amazing-feature`)

3. Commit changes (`git commit -m 'Add amazing feature'`)

4. Push to branch (`git push origin feature/amazing-feature`)

5. Open a Pull Request


## 📝 License


This project is licensed under the MIT License.


## 👥 Support


For support, email support@localguide.com or create an issue in the repository.


## 🙏 Acknowledgments


- Express.js team

- Prisma team

- Stripe

- Cloudinary

- All contributors


---


**Built with ❤️ for connecting travelers with local experiences**
```
