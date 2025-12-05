# Rentverse - Smart Rental Trust Engine & Mobile Ecosystem

**Rentverse** is an enterprise-grade backend powering a **Mobile-First Rental Marketplace** and a **Web-Based Admin Command Center**.

It solves the "Trust Deficit" in the rental market using a proprietary **Trust Analysis Engine**. This engine calculates **Tenant Trust Index (TTI)** and **Landlord Reliability Score (LRS)** using a transparent, immutable ledger of behavioral events, financial transactions, and AI-assisted audits.

> **Environment Note:** This project is engineered on **Node.js 24 LTS** and **TypeScript 5.x** (NodeNext) to ensure bleeding-edge performance, strict type safety, and long-term maintainability.

## 🚀 Tech Stack

- **Language:** TypeScript 5.x (Strict Mode)
- **Runtime:** Node.js 24 LTS
- **Architecture:** Modular Monolith (Controller-Service-Repository Pattern)
- **Database:** PostgreSQL 15
- **ORM:** Prisma v6 (with EAV Pattern & Trust Ledger)
- **Caching & Queue:** Redis (Session & Job Queue)
- **Storage:** MinIO (S3 Compatible - Hybrid Public/Private buckets)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Validation:** Zod
- **Infrastructure:** Docker & Docker Compose (Multi-stage builds)

## 🌟 Key Features

### 1\. The Trust Ledger (v2 Engine)

Unlike simple "star ratings," Rentverse uses a financial-grade ledger (`TrustLog`) to track scores.

- **Source of Truth:** Every score change is recorded with an `actor` (System, Admin, or AI) and `sourceType`.
- **Immutable History:** Admin overrides are logged as distinct events, not database edits, ensuring full auditability.
- **AI Readiness:** Logs include a `metadata` JSONB field to store AI sentiment analysis and confidence scores for future agentic automation.

### 2\. Mobile-First Architecture

Designed to serve **React Native / Flutter** clients:

- **Stateless Auth:** Long-lived JWTs with secure refresh rotation.
- **Device Management:** Tracks User Devices (`UserDevice`) for targeted Push Notifications.
- **Unified API:** Consistent JSON responses (`ResponseHelper`) strictly typed for mobile parsing.

### 3\. Dynamic Property Specs (EAV)

Property attributes (e.g., "EV Charger", "Pet Friendly") are fully dynamic using the **Entity-Attribute-Value** pattern. New specifications can be added via database seeding without altering the schema or deploying new code.

### 4\. Escrow Finance System

Built-in **Wallet & Payout** module. Rent payments are held in a digital ledger (Midtrans integration) before being withdrawn by landlords, ensuring platform fees are collected and fraud is minimized.

### 5\. Secure KYC

Identity verification system with **Private Storage** for sensitive documents (ID Cards/Selfies), utilizing time-limited signed URLs for access.

## 🛠️ Prerequisites

Ensure you have the following tools installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for infrastructure)
- [Node.js v24+](https://nodejs.org/) (Recommended for local tooling)

## ⚡ Quick Start

Follow these steps to get the ecosystem running.

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

### 3\. Start Infrastructure

Run Docker Compose to spin up the containers (App, Postgres, Redis, MinIO).

```bash
npm run docker:dev
```

### 4\. Database Setup (CRITICAL)

⚠️ **IMPORTANT:** Rentverse relies on **Reference Data** (Roles, Attributes, Trust Rules) to function. You must seed the database after the first deployment.

```bash
# 1. Push Schema to DB
npm run db:push

# 2. Seed Master Data
npm run db:seed
```

The API is now active at `http://localhost:3000/api/v1`.

## 📂 Project Structure

We follow a **Modular Monolith** architecture organized by **Business Domain**.

```text
src/
├── modules/             # BUSINESS DOMAINS
│   ├── auth/            # Identity, RBAC, KYC, Device Mgmt
│   ├── rental/          # Property Listing (EAV), Search
│   ├── finance/         # Wallet, Payouts
│   ├── payment/         # Midtrans, Invoicing
│   ├── trust/           # Scoring Engine, Trust Ledger
│   └── chat/            # Real-time Chat
├── middleware/          # Auth, Validation, Uploads
├── shared/              # Services (Storage, Notification)
└── config/              # Env, Logger, Redis, Prisma
```

## 🔐 Default Credentials (Local Dev)

- **API Base URL:** `http://localhost:3000/api/v1`
- **Prisma Studio:** `http://localhost:5555`
- **MinIO Console:** `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin`)
- **Super Admin:** `admin@rentverse.com` / `admin123`

## 🛡️ Trust Engine Logic

The Trust Engine operates on an **Event-Driven** model:

| Trigger           | Actor  | Event Code           | Impact      |
| :---------------- | :----- | :------------------- | :---------- |
| Payment Success   | SYSTEM | `PAYMENT_ON_TIME`    | `+2.0 TTI`  |
| Late Payment      | SYSTEM | `PAYMENT_LATE`       | `-5.0 TTI`  |
| Chat Reply \< 30m | SYSTEM | `FAST_RESPONSE`      | `+1.0 LRS`  |
| Dispute Resolved  | ADMIN  | `DISPUTE_WIN_TENANT` | `+10.0 TTI` |

## 📝 Environment Variables

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
MINIO_SECRET_KEY=minioadmin
STORAGE_PUBLIC_HOST=http://localhost:9000

# SECURITY
JWT_SECRET=rentverse_secret_key_2025

# PAYMENT (MIDTRANS)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx

# NOTIFICATIONS (FCM)
# FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

---

_Built with ❤️ by Rentverse Backend Team_
