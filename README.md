# Rentverse - Smart Rental Trust Dashboard & Marketplace

**Rentverse** is an end-to-end property rental ecosystem integrating a Marketplace, Payment Gateway (Midtrans), and a sophisticated Trust Analysis System.

[cite\_start]It utilizes the **Tenant Trust Index (TTI)** and **Landlord Reliability Score (LRS)** algorithms to automatically assess risk based on user behavioral data[cite: 1, 5, 7].

> **Note:** This project is built using **TypeScript** on **Node.js 24 LTS** to ensure cutting-edge performance, type safety, and scalability.

## 🚀 Tech Stack

  * **Language:** TypeScript (NodeNext Module Resolution)
  * **Runtime:** Node.js (v24 LTS)
  * **Framework:** Express.js (Modular Monolith Architecture)
  * **Database:** PostgreSQL 15
  * **ORM:** Prisma
  * **Caching & Queue:** Redis
  * **Object Storage:** MinIO (S3 Compatible)
  * **Validation:** Zod
  * **Logging:** Winston
  * **Docs:** Swagger (OpenAPI 3.0)
  * **Infrastructure:** Docker & Docker Compose

## 🛠️ Prerequisites

Ensure you have the following tools installed:

  * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required)
  * [Node.js v24+](https://nodejs.org/) (Required for local development)

## ⚡ Quick Start

Follow these 4 steps to get the entire infrastructure (App, DB, Redis, MinIO) running.

### 1\. Clone Repository & Install Dependencies

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

*Ensure the configurations match `docker-compose.yml`.*

### 3\. Start Infrastructure

Run Docker Compose to spin up the containers.

```bash
docker-compose up -d --build
```

*Wait until all containers are in `healthy` or `running` state.*

### 4\. Database Setup & Seeding

We need to push the Prisma schema to the database and seed initial data (Admin Role, Event Configs, etc.).

```bash
# Push schema to DB
npx prisma db push

# Seed initial data
npm run db:seed
```

The server is now running at `http://localhost:3000`.

-----

## 📂 Project Structure

We follow a **Modular Monolith** architecture. Code is organized by **Business Domain**, not by Technical Layer.

```text
src/
├── @types/              # Custom Type Definitions
├── config/              # Configuration (DB, Redis, MinIO, Swagger)
├── middleware/          # Global Middlewares (Auth, Error, Validation)
├── modules/             # BUSINESS LOGIC MODULES
│   ├── auth/            # Login, Register, RBAC
│   ├── rental/          # Property Listing, Booking
│   ├── payment/         # Midtrans Integration, Invoicing
│   ├── trust/           # TTI/LRS Scoring Logic, Logs
│   └── chat/            # Real-time Chat & Response Analysis
├── shared/              # Shared Utilities (EventBus, StorageService)
├── app.ts               # Express App Entry Point
└── server.ts            # Server Initialization
```

## 🔐 Access & Credentials (Local)

Default credentials for development environment:

  * **API Base URL:** `http://localhost:3000/api/v1`
  * **Swagger Docs:** `http://localhost:3000/api-docs`
  * **Prisma Studio (DB GUI):** `http://localhost:5555`
  * **MinIO Console (Storage):** `http://localhost:9001`
      * User: `minioadmin`
      * Pass: `miniosecretpassword`
  * **Super Admin Account:**
      * Email: `admin@rentverse.com`
      * Password: `admin123` *(Created during seeding)*

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Run server in development mode (hot-reload with `nodemon` + `ts-node`) |
| `npm run build` | Compile TypeScript to JavaScript (`dist/`) |
| `npm start` | Run the compiled production build |
| `npm run db:push` | Push Prisma schema changes to database |
| `npm run db:seed` | Run database seeder |
| `npm run lint` | Check for type errors and linting issues |

## 🛡️ Coding Standards

### 1\. TypeScript & Type Safety

  * **Strict Mode:** Always enabled. Do not use `any`. Define interfaces/DTOs for all data structures.
  * **Prisma:** Utilize generated types from Prisma Client for database results.

### 2\. Error Handling

Do not use `try-catch` blocks in Controllers. Use the `catchAsync` wrapper.

```typescript
const getScore = catchAsync(async (req: Request, res: Response) => {
  // Logic...
});
```

### 3\. Validation

All request inputs (`req.body`) **MUST** be validated using **Zod** schemas before reaching the controller.

### 4\. Database Transactions

[cite\_start]Operations involving **Money (Payment)** and **Scores (Trust)** must be wrapped in `prisma.$transaction`[cite: 5, 8].

### 5\. Storage Strategy

  * **Public:** Property Photos & Profiles (`isPublic: true`).
  * **Private:** ID Cards, Contracts, Evidence (`isPublic: false`).

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

*Built with ❤️ by Rentverse DevOps Team*