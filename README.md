# Rentverse Backend

**Smart Rental Trust Dashboard & Marketplace API**

A comprehensive backend system for a modern property rental platform with integrated trust scoring, payment processing, real-time chat, and WhatsApp notifications.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Management](#database-management)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Infrastructure Services](#infrastructure-services)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Testing](#testing)
- [License](#license)

---

## 🎯 Overview

Rentverse Backend is a production-ready RESTful API built with **Node.js 24**, **TypeScript**, **Express**, and **Prisma ORM**. It powers a rental marketplace platform with advanced features including:

- **Trust Scoring Engine** - Dynamic trust profiles for tenants (TTI) and landlords (LRS)
- **Property Management** - Comprehensive property listings with multi-image support
- **Booking System** - Recurring billing with automated invoice generation
- **Payment Integration** - Midtrans payment gateway with wallet system
- **Real-time Communication** - Socket.IO-based chat and Firebase push notifications
- **WhatsApp Integration** - Automated notifications via WAHA (WhatsApp HTTP API)
- **Dispute Resolution** - Built-in dispute management system
- **KYC Verification** - Identity verification for users
- **iCal Integration** - Import/sync property availability calendars

---

## ✨ Key Features

### 🏠 Property & Rental Management
- Create, update, and manage property listings
- Multiple property types (apartment, house, villa, etc.)
- Listing types (rent, sale)
- Multi-image uploads with primary image designation
- Property attributes and amenities
- Location-based search with geocoding
- Favorites/wishlist functionality
- Property verification system
- iCal URL import for availability calendars

### 🔐 Authentication & Authorization
- JWT-based authentication
- Email and phone verification with OTP
- Role-based access control (RBAC)
- Multi-device FCM token management
- Password reset functionality
- User profile management

### 💳 Payments & Finance
- **Midtrans** payment gateway integration
- Automated recurring billing
- Invoice generation and management
- Multi-currency support (default: IDR)
- Wallet system for landlords
- Payout request management
- Transaction history tracking

### 📊 Trust & Reputation System
- **Tenant Trust Index (TTI)** - Dynamic scoring based on payment history, behavior
- **Landlord Reputation Score (LRS)** - Based on response rate, property quality
- Event-based trust score adjustments
- Comprehensive trust logs with evidence tracking
- Automated trust score recalculation

### 💬 Communication
- Real-time chat with **Socket.IO**
- Redis adapter for horizontal scaling
- Chat room management
- Message read receipts
- **Firebase Cloud Messaging** for push notifications
- **WhatsApp integration** via WAHA for automated notifications
- Email notifications via SMTP (Mailpit for development)

### 📅 Booking & Calendar
- Property booking management
- Booking status tracking (pending, confirmed, active, completed, cancelled)
- Flexible billing periods (monthly, quarterly, yearly)
- External booking import (iCal support)
- Automated calendar synchronization
- Next payment date tracking

### 🛡️ Dispute Resolution
- Dispute creation and management
- Status tracking (open, resolved, rejected)
- Admin resolution tools
- Multiple resolution outcomes (refund, payout, split)
- Evidence and notes management

### ⭐ Reviews & Ratings
- Bidirectional reviews (tenant ↔ landlord)
- Star ratings and comments
- Automated property rating aggregation
- Review verification (booking-based)

### 🔔 Notifications
- In-app notification center
- Push notifications via Firebase
- WhatsApp notifications via WAHA
- Email notifications
- Notification categorization (booking, system, chat, payment)
- Read/unread status tracking

### 👔 KYC Verification
- Identity verification for tenants and landlords
- KTP (Indonesian ID) upload and verification
- Selfie verification
- Verification status tracking

### 🛠️ Admin Features
- User management
- Property verification
- Dispute resolution
- Payout approval
- System-wide analytics

---

## 🛠️ Technology Stack

### Core Framework
- **Runtime**: Node.js 24.x (LTS)
- **Language**: TypeScript 5.9+
- **Framework**: Express 5.1
- **ORM**: Prisma 6.19

### Database & Caching
- **Primary Database**: PostgreSQL 15
- **Cache & Sessions**: Redis (Alpine)
- **Queue System**: BullMQ (Redis-backed)

### File Storage
- **Object Storage**: MinIO (S3-compatible)
- **Upload Handler**: Multer 2.0

### Authentication & Security
- **JWT**: jsonwebtoken
- **Password Hashing**: bcrypt
- **Security Headers**: Helmet
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit with Redis store

### Payment & Notifications
- **Payment Gateway**: Midtrans
- **Push Notifications**: Firebase Admin SDK
- **WhatsApp**: WAHA (WhatsApp HTTP API)
- **Email**: Nodemailer with Mailpit (dev) / SMTP (prod)

### Real-time & Workers
- **WebSocket**: Socket.IO 4.8
- **Job Queue**: BullMQ
- **Cron Jobs**: node-cron

### Calendar & Events
- **iCal Import**: node-ical
- **iCal Export**: ical-generator

### Development Tools
- **Process Manager**: Nodemon
- **Build Tool**: tsx (for ESM support)
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Multi-stage Dockerfile
- **Logging**: Winston
- **Reverse Proxy**: Compatible with Nginx Proxy Manager

---

## 🏗️ Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│               (Web App, Mobile App, Admin)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
│            (Express + Helmet + CORS + Rate Limit)           │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Auth      │  │  Business   │  │   Admin     │
│  Middleware │  │   Modules   │  │  Middleware │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  PostgreSQL │  │    Redis    │  │    MinIO    │
│  (Prisma)   │  │  (Cache +   │  │   (S3)      │
│             │  │   Queue)    │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Module Architecture

Each module follows a layered architecture:

```
routes.ts     → Controller → Service → Repository → Database
    ↓              ↓           ↓
schema.ts     validation  business    data access
                logic      logic       layer
```

### Event-Driven Architecture

The application uses event subscribers for cross-module communication:

- **Trust Subscribers**: Update trust scores on booking/payment events
- **Notification Subscribers**: Send notifications on various events
- **Finance Subscribers**: Handle wallet transactions
- **Auth Subscribers**: Manage user device tokens
- **Property Subscribers**: Handle iCal imports and calendar sync

### Queue System

BullMQ workers handle asynchronous tasks:

- **OTP Queue**: Email/SMS OTP delivery
- **Notification Queue**: Push notification batching
- **Chat Queue**: WhatsApp message delivery
- **Calendar Scheduler**: Periodic iCal synchronization
- **Billing Worker**: Automated recurring invoice generation

---

## 📦 Prerequisites

Before running this project, ensure you have:

- **Node.js**: >= 24.0.0 (LTS recommended)
- **Docker**: >= 20.10.x
- **Docker Compose**: >= 2.x
- **Git**: For version control

Optional (for local development without Docker):
- **PostgreSQL**: 15.x
- **Redis**: Latest stable
- **MinIO**: Latest stable

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dean131/rentverse-backend
cd rentverse-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Generate a service account key
3. Save it as `firebase-service-account.json` in the project root
4. Enable Firebase Cloud Messaging (FCM)

### 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#configuration) section).

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `DATABASE_URL` | PostgreSQL connection string | (see .env.example) |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `MINIO_ENDPOINT` | MinIO endpoint | `minio` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET` | Default bucket name | `rentverse-public` |
| `JWT_SECRET` | JWT signing secret | (generate secure key) |
| `MIDTRANS_SERVER_KEY` | Midtrans server key | (from Midtrans) |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key | (from Midtrans) |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase service account | `./firebase-service-account.json` |
| `SMTP_HOST` | SMTP server host | `mailpit` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `WAHA_API_URL` | WAHA API endpoint | `http://localhost:8080` |
| `WAHA_API_KEY` | WAHA API key | (generate secure key) |

> **Security Note**: Always use strong, randomly generated values for `JWT_SECRET`, `WAHA_API_KEY`, and database passwords in production.

---

## 🏃 Running the Application

### Development Mode (with Docker)

**Recommended for development**. Includes hot-reload, Prisma Studio, and all development tools:

```bash
npm run docker:dev
```

This starts:
- **API Server**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **Mailpit UI**: http://localhost:8025
- **MinIO Console**: http://localhost:9001
- **WAHA Dashboard**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Development Mode (Local)

For local development without Docker:

```bash
# Ensure PostgreSQL, Redis, and MinIO are running

# Push database schema
npm run db:push

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

### Production Mode (with Docker)

```bash
npm run docker:prod
```

This uses the production Docker target with:
- Compiled TypeScript
- Optimized dependencies (no devDependencies)
- Non-root user execution
- Health checks enabled

### Stopping Services

```bash
# Development
npm run docker:dev-down

# Production
npm run docker:prod-down
```

---

## 🗄️ Database Management

### Push Schema to Database

```bash
npm run db:push
```

This syncs your Prisma schema to the database without migrations.

### Seed Database

Populate the database with initial data (roles, property types, etc.):

```bash
npm run db:seed
```

For Docker environments:

```bash
npm run docker:db-push
npm run docker:db-seed
```

### Prisma Studio

Explore and edit your database with a GUI:

```bash
npm run db:studio
```

Access at: http://localhost:5555

### Migrations (Production)

For production, use Prisma migrations:

```bash
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```bash
GET /
```

Response:
```json
{
  "status": "success",
  "message": "Rentverse Backend (Node 24 + TS) is Online",
  "timestamp": "2025-12-28T11:16:08.123Z"
}
```

### API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /verify-email` - Verify email with OTP
- `POST /verify-phone` - Verify phone with OTP
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /devices` - Register FCM device token

#### Properties (`/api/v1/properties`)
- `GET /` - List all properties (with filters)
- `GET /:id` - Get property details
- `POST /` - Create property (landlord)
- `PUT /:id` - Update property
- `DELETE /:id` - Delete property
- `POST /:id/images` - Upload property images
- `DELETE /images/:imageId` - Delete property image
- `POST /:id/favorite` - Add to favorites
- `DELETE /:id/favorite` - Remove from favorites

#### Rental (`/api/v1/rental`)
- `GET /types` - Get property types
- `GET /listing-types` - Get listing types
- `GET /billing-periods` - Get billing periods
- `GET /attributes` - Get property attribute types

#### Bookings (`/api/v1/bookings`)
- `GET /` - List user bookings
- `GET /:id` - Get booking details
- `POST /` - Create booking
- `PUT /:id/cancel` - Cancel booking
- `GET /:id/invoices` - Get booking invoices

#### Payments (`/api/v1/payments`)
- `POST /invoices/:id/pay` - Create payment link
- `POST /midtrans/callback` - Midtrans webhook

#### Finance (`/api/v1/finance`)
- `GET /wallet` - Get wallet balance
- `GET /transactions` - Get wallet transactions
- `POST /payout` - Request payout
- `GET /payouts` - List payout requests

#### Chat (`/api/v1/chats`)
- `GET /rooms` - List chat rooms
- `GET /rooms/:id` - Get room details
- `POST /rooms` - Create/get chat room
- `GET /rooms/:id/messages` - Get messages
- `POST /rooms/:id/messages` - Send message
- `PUT /messages/:id/read` - Mark as read

#### Notifications (`/api/v1/notifications`)
- `GET /` - List notifications
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read

#### KYC (`/api/v1/kyc`)
- `POST /tenant/ktp` - Upload tenant KTP
- `POST /tenant/selfie` - Upload tenant selfie
- `POST /landlord/ktp` - Upload landlord KTP
- `GET /status` - Get KYC status

#### Disputes (`/api/v1/disputes`)
- `GET /` - List disputes
- `GET /:id` - Get dispute details
- `POST /` - Create dispute
- `PUT /:id` - Update dispute status

#### Reviews (`/api/v1/reviews`)
- `POST /` - Create review
- `GET /booking/:id` - Get booking reviews
- `GET /property/:id` - Get property reviews

#### Calendar (`/api/v1/calendar`)
- `GET /property/:id` - Get property calendar
- `POST /property/:id/import` - Import iCal URL
- `GET /property/:id/export.ics` - Export as iCal

#### Admin (`/api/v1/admin`)
- `GET /users` - List all users
- `GET /properties` - List all properties
- `PUT /properties/:id/verify` - Verify property
- `GET /disputes` - List all disputes
- `PUT /disputes/:id/resolve` - Resolve dispute
- `GET /payouts` - List payout requests
- `PUT /payouts/:id/approve` - Approve payout

#### Landlord (`/api/v1/landlord`)
- `GET /dashboard` - Landlord analytics
- `GET /bookings` - Landlord's bookings
- `GET /properties` - Landlord's properties
- `GET /revenue` - Revenue statistics

### WebSocket Events

Connect to Socket.IO at `http://localhost:3000`:

**Events:**
- `chat:message` - New chat message
- `chat:read` - Message read receipt
- `notification:new` - New notification
- `booking:update` - Booking status update
- `trust:update` - Trust score update

---

## 📁 Project Structure

```
rentverse-backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
├── src/
│   ├── @types/             # Custom TypeScript types
│   ├── config/             # Configuration files
│   │   ├── env.ts          # Environment variables
│   │   ├── logger.ts       # Winston logger
│   │   ├── prisma.ts       # Prisma client
│   │   ├── redis.ts        # Redis client
│   │   ├── firebase.ts     # Firebase Admin
│   │   └── minio.ts        # MinIO client
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── modules/            # Business modules
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── booking/
│   │   ├── calendar/
│   │   ├── chat/
│   │   ├── dispute/
│   │   ├── finance/
│   │   ├── kyc/
│   │   ├── landlord/
│   │   ├── notification/
│   │   ├── payment/
│   │   ├── rental/
│   │   ├── review/
│   │   └── trust/
│   ├── shared/             # Shared utilities
│   │   └── services/
│   │       ├── event.service.ts
│   │       ├── socket.service.ts
│   │       ├── storage.service.ts
│   │       └── whatsapp.service.ts
│   ├── workers/            # Background workers
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── logs/                   # Application logs
├── .env.example            # Environment template
├── .dockerignore
├── .gitignore
├── compose.yml             # Development Docker Compose
├── compose.prod.yml        # Production Docker Compose
├── Dockerfile              # Multi-stage Dockerfile
├── nodemon.json            # Nodemon config
├── package.json
├── tsconfig.json           # TypeScript config
└── README.md
```

### Module Structure

Each module follows this pattern:

```
module-name/
├── module-name.routes.ts       # Express routes
├── module-name.controller.ts   # Request handlers
├── module-name.service.ts      # Business logic
├── module-name.repository.ts   # Database queries
├── module-name.schema.ts       # Zod validation schemas
├── module-name.subscribers.ts  # Event subscribers
├── module-name.queue.ts        # Queue workers (if applicable)
└── module-name.worker.ts       # Cron jobs (if applicable)
```

---

## 🧩 Core Modules

### 1. Authentication (`auth`)
Handles user registration, login, JWT token management, and OTP verification.

**Key Files:**
- `auth.service.ts` - Login, register, token generation
- `otp.queue.ts` - OTP email/SMS queue worker
- `auth.middleware.ts` - JWT verification middleware

### 2. Rental & Properties (`rental`)
Property listings, search, favorites, and property management.

**Key Files:**
- `properties.service.ts` - CRUD operations
- `properties.repository.ts` - Complex queries with filters
- `properties.subscribers.ts` - iCal import handling

### 3. Booking (`booking`)
Booking creation, status management, and recurring billing setup.

**Key Files:**
- `booking.service.ts` - Booking lifecycle
- `booking.repository.ts` - Booking queries with relations

### 4. Payment (`payment`)
Midtrans integration for payment processing and invoice management.

**Key Files:**
- `payment.service.ts` - Payment link generation
- Webhook handling for payment callbacks

### 5. Trust Engine (`trust`)
Dynamic trust scoring for tenants and landlords based on behavior.

**Key Files:**
- `trust.subscribers.ts` - Event-based score updates
- Trust profile management (TTI/LRS)

### 6. Chat (`chat`)
Real-time messaging with Socket.IO and WhatsApp integration.

**Key Files:**
- `chat.service.ts` - Chat room and message management
- `chat.queue.ts` - WhatsApp message worker
- `socket.service.ts` (shared) - Socket.IO setup

### 7. Finance (`finance`)
Wallet system, transactions, and payout management for landlords.

**Key Files:**
- `finance.service.ts` - Wallet operations
- `finance.subscribers.ts` - Automated wallet transactions

### 8. Dispute (`dispute`)
Dispute creation and resolution workflow.

**Key Files:**
- `dispute.service.ts` - Dispute CRUD
- Admin resolution tools

### 9. KYC (`kyc`)
Identity verification with KTP and selfie upload.

**Key Files:**
- `kyc.service.ts` - Verification management
- Integration with MinIO for secure storage

### 10. Notifications (`notification`)
Multi-channel notifications (in-app, push, email, WhatsApp).

**Key Files:**
- `notification.queue.ts` - Notification dispatcher
- `notification.subscribers.ts` - Event-driven notifications

### 11. Reviews (`review`)
Rating and review system for properties and users.

**Key Files:**
- `review.service.ts` - Review CRUD
- Automated rating aggregation

### 12. Calendar (`calendar`)
iCal import/export and availability management.

**Key Files:**
- `calendar.service.ts` - Calendar operations
- `calendar.queue.ts` - Periodic iCal sync scheduler

### 13. Billing (`billing`)
Automated recurring invoice generation.

**Key Files:**
- `billing.worker.ts` - Cron-based invoice creation

### 14. Admin (`admin`)
Administrative tools and system management.

**Key Files:**
- `admin.service.ts` - Admin operations
- User, property, and dispute management

### 15. Landlord (`landlord`)
Landlord-specific dashboard and analytics.

**Key Files:**
- `landlord.service.ts` - Analytics and reporting

---

## 🏭 Infrastructure Services

### PostgreSQL Database
- **Purpose**: Primary data store
- **Port**: 5432
- **Volume**: `pgdata`
- **Health Check**: `pg_isready`

### Redis Cache
- **Purpose**: Caching, sessions, queue backend, rate limiting
- **Port**: 6379
- **Volume**: `redisdata`
- **Health Check**: `redis-cli ping`

### MinIO Storage
- **Purpose**: S3-compatible object storage for images and files
- **API Port**: 9000
- **Console Port**: 9001
- **Volume**: `miniodata`
- **Default Bucket**: `rentverse-public`

### Mailpit (Development)
- **Purpose**: Email testing and debugging
- **SMTP Port**: 1025
- **Web UI**: http://localhost:8025
- Captures all outbound emails

### WAHA (WhatsApp)
- **Purpose**: WhatsApp message delivery
- **API Port**: 8080 (mapped from container 3000)
- **Dashboard**: http://localhost:8080
- **Volumes**: `waha_sessions`, `waha_media`
- **Engine**: NOWEB (lightweight)

---

## 💻 Development

### Development Tools

#### 1. Prisma Studio
Visual database browser:

```bash
npm run db:studio
```

Access at: http://localhost:5555

#### 2. Mailpit
Email testing interface:

```bash
# Access Mailpit UI (when docker:dev is running)
# http://localhost:8025
```

#### 3. MinIO Console
Object storage management:

```bash
# Access MinIO Console (when docker:dev is running)
# http://localhost:9001
# Login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
```

#### 4. WAHA Dashboard
WhatsApp session management:

```bash
# Access WAHA Dashboard (when docker:dev is running)
# http://localhost:8080
# Login with WAHA_DASHBOARD_USERNAME and WAHA_DASHBOARD_PASSWORD
```

### Hot Reload

Development mode includes hot reload via Nodemon:

```bash
npm run dev
```

Changes to TypeScript files automatically restart the server.

### Code Quality

Lint your code:

```bash
npm run lint
```

### Debugging

Enable debug logs by setting in `.env`:

```env
LOG_LEVEL=debug
```

Logs are written to:
- Console (development)
- `logs/` directory (all environments)

---

## 🚢 Production Deployment

### Build Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Production Docker Setup

1. **Update `.env` for production**:
   - Set `NODE_ENV=production`
   - Use strong passwords and secrets
   - Configure production SMTP server
   - Update CORS origins
   - Configure Midtrans production keys

2. **Update `compose.prod.yml`**:
   - Remove port mappings for internal services
   - Configure reverse proxy (e.g., Nginx Proxy Manager)
   - Set resource limits

3. **Deploy**:

```bash
npm run docker:prod
```

### Database Migrations

For production, use Prisma Migrate:

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

### Environment Variables

Ensure all production environment variables are set:
- Strong `JWT_SECRET`
- Production database credentials
- Production `MIDTRANS_SERVER_KEY` and `MIDTRANS_CLIENT_KEY`
- Production SMTP configuration
- Secure `WAHA_API_KEY`

### Reverse Proxy Setup

The application is designed to work behind a reverse proxy (e.g., Nginx):

```nginx
location /api {
    proxy_pass http://rentverse_api:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /socket.io {
    proxy_pass http://rentverse_api:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Health Checks

The production container includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1
```

### Logging

Winston logger writes to:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

Rotate logs with logrotate or similar tools.

### Monitoring

Recommended monitoring tools:
- **Application Performance**: New Relic, DataDog, or Sentry
- **Infrastructure**: Prometheus + Grafana
- **Uptime**: UptimeRobot or Pingdom

---

## 🧪 Testing

### Manual Testing

Use the included Postman collection:

```bash
# Import the collection from ./postman directory
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Testing WhatsApp

1. Access WAHA Dashboard: http://localhost:8080
2. Create a session
3. Scan QR code with WhatsApp
4. Send test message via API

### Testing Payments

Use Midtrans sandbox credentials:
- **Test Card**: 4811 1111 1111 1114
- **CVV**: 123
- **Expiry**: Any future date

---

## 📄 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

## 🎉 Acknowledgments

- Built with ❤️ using modern web technologies
- Powered by Node.js, TypeScript, and Prisma
- Special thanks to the open-source community

---

**Happy Coding! 🚀**
