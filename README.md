# Rentverse - Smart Rental Trust Dashboard & Marketplace

**Rentverse** is an enterprise-grade property rental ecosystem integrating a dynamic Marketplace, Escrow Payment System (Midtrans), and a sophisticated Trust Analysis Engine.

It utilizes the **Tenant Trust Index (TTI)** and **Landlord Reliability Score (LRS)** algorithms to automatically assess risk based on user behavioral data, financial transactions, and interaction history.

> **Environment Note:** This project is engineered on **Node.js 24 LTS** and **TypeScript** (NodeNext) to ensure bleeding-edge performance, strict type safety, and long-term maintainability.

## 🚀 Tech Stack

  * **Language:** TypeScript 5.x (Strict Mode)
  * **Runtime:** Node.js 24 LTS
  * **Architecture:** Modular Monolith (Controller-Service-Repository Pattern)
  * **Database:** PostgreSQL 15
  * **ORM:** Prisma v7 (with EAV Pattern & Custom Output)
  * **Caching & Queue:** Redis
  * **Object Storage:** MinIO (S3 Compatible - Hybrid Public/Private)
  * **Validation:** Zod
  * **Logging:** Winston (Structured JSON)
  * **Docs:** Swagger (OpenAPI 3.0)
  * **Infrastructure:** Docker & Docker Compose (Multi-stage builds)

## 🌟 Key Features

1.  **Dynamic Property Specs (EAV Pattern):** Property attributes (e.g., Bedrooms, Bathrooms, Amenities) are fully dynamic. New specifications can be added via database seeding without altering the schema (`ALTER TABLE`).
2.  **Trust Scoring Engine:** Automated scoring system updates TTI & LRS in real-time based on payment behavior, verified complaints, and chat response analytics.
3.  **Escrow Finance System:** Built-in **Wallet & Payout** module. Rent payments are held in a digital ledger before being withdrawn by landlords, ensuring platform fees are collected and fraud is minimized.
4.  **Secure KYC:** Identity verification system with private storage for sensitive documents (ID Cards/Selfies), utilizing signed URLs for access.
5.  **Database-Driven RBAC:** Granular permission management stored in the database and cached in Redis for high-performance authorization.

## 🛠️ Prerequisites

Ensure you have the following tools installed:

  * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for infrastructure)
  * [Node.js v24+](https://nodejs.org/) (Recommended for local tooling/intellisense)

## ⚡ Quick Start

Follow these steps to get the entire infrastructure (App, DB, Redis, MinIO) running in minutes.

### 1\. Clone & Install

```bash
git clone https://github.com/rentverse/backend.git
cd rentverse-backend
npm install
```

### 2\. Setup Environment Variables

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

*Ensure the configurations match `compose.yml`.*

### 3\. Start Infrastructure

Run Docker Compose to spin up the containers in development mode (Hot-Reload enabled).

```bash
npm run docker:dev
```

*Wait until all containers are in `healthy` state.*

### 4\. Database Setup (CRITICAL STEP)

⚠️ **IMPORTANT:** Because we use the **EAV Pattern**, **RBAC**, and **Normalized Tables**, the application relies on Reference Data to function. You **MUST** run the seeder immediately after the first deployment.

```bash
# 1. Push Schema to DB
npm run db:push

# 2. Seed Master Data (Attributes, Roles, Events, Billing Periods, Admin)
npm run db:seed
```

The server is now running at `http://localhost:3000`.

-----

## 📂 Project Structure

We follow a **Modular Monolith** architecture organized by **Business Domain**.

```text
src/
├── @types/              # Custom Type Definitions
├── config/              # Configuration (DB, Redis, MinIO, Swagger, Logger)
├── middleware/          # Global Middlewares (Auth, Error, Validation)
├── modules/             # BUSINESS LOGIC MODULES
│   ├── auth/            # Login, Register, RBAC, KYC
│   ├── rental/          # Property Listing (EAV Logic), Booking
│   ├── finance/         # Wallet, Payouts, Bank Accounts
│   ├── payment/         # Midtrans Integration, Invoicing, Scheduler
│   ├── trust/           # Scoring Logic, Trust Logs
│   └── chat/            # Real-time Chat & Response Time Analysis
├── shared/              # Shared Layer
│   ├── prisma-client/   # Generated Prisma Client (Custom Output)
│   ├── services/        # Infrastructure Services (Storage, Email)
│   └── utils/           # Helpers (AppError, ResponseHelper)
├── app.ts               # Express App Setup
└── server.ts            # Server Entry Point
```

## 🔐 Default Credentials (Local Dev)

  * **API Base URL:** `http://localhost:3000/api/v1`
  * **Swagger Docs:** `http://localhost:3000/api-docs`
  * **Prisma Studio (DB GUI):** `http://localhost:5555`
  * **MinIO Console:** `http://localhost:9001`
      * User: `minioadmin`
      * Pass: `miniosecretpassword`
  * **Super Admin Account:**
      * Email: `admin@rentverse.com`
      * Password: `admin123` *(Created during seeding)*

## 🛡️ Coding Standards & Patterns

### 1\. Controller-Service-Repository (CSR)

We strictly separate concerns:

  * **Controller:** Handles HTTP requests, validation, and responses.
  * **Service:** Contains business logic, calculations, and transaction management.
  * **Repository:** Handles direct database queries via Prisma.

### 2\. Type Safety

  * Do not use `any`. Use interfaces/DTOs defined in the module.
  * Use Prisma generated types for database entities.

### 3\. Error Handling

Never use `try-catch` blocks in Controllers. Use the `catchAsync` wrapper to delegate errors to the Global Error Handler.

```typescript
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result);
});
```

### 4\. Validation

All request inputs (`req.body`, `req.query`) **MUST** be validated using **Zod** schemas via the validation middleware.

### 5\. Storage Strategy (Hybrid)

  * **Public (`isPublic: true`):** Property Photos, Avatars. Accessible via direct URL.
  * **Private (`isPublic: false`):** ID Cards, Contracts, Evidence. Accessible only via pre-signed URLs generated by the backend.

## 📝 Environment Variables Reference

```env
# APP
NODE_ENV=development
PORT=3000

# DATABASE
DATABASE_URL=postgresql://rentverse:supersecurepassword@db:5432/rentverse_db?schema=public

# CACHE (REDIS)
REDIS_HOST=cache
REDIS_PORT=6379

# STORAGE (MINIO)
MINIO_ENDPOINT=minio_storage
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=miniosecretpassword
STORAGE_PUBLIC_HOST=http://localhost:9000

# SECURITY
JWT_SECRET=rentverse_secret_key_2025

# PAYMENT (MIDTRANS SANDBOX)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
```

-----

*Built with ❤️ by Rentverse Backend Team*