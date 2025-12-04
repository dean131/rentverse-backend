# 🗺️ Rentverse Project Roadmap

This document outlines the development stages for the **Rentverse Backend API**.
It follows a **Modular Monolith** approach, prioritizing foundational stability before moving to complex business logic.

**Current Status:** 🚧 Phase 0 (Infrastructure Ready)

---

## 🏁 Phase 0: Foundation & Infrastructure (Week 1 - Days 1-2)

**Goal:** Establish a stable development environment (`dev`) and ensure all systems (DB, Cache, Storage) are communicating.

- [ ] **Project Initialization**
  - [x] Setup Node.js v24 LTS + TypeScript (Strict Mode).
  - [x] Configure ESLint & Prettier.
  - [x] Setup Modular Folder Structure (`src/modules/*`).
- [ ] **Containerization (DevOps)**
  - [x] Create `Dockerfile` (Multi-stage build).
  - [x] Create `compose.yml` (App, Postgres 15, Redis, MinIO).
  - [ ] Verify Healthchecks for all containers.
- [ ] **Database & Seeding (CRITICAL)**
  - [x] Define Prisma Schema v3.2 (EAV, Multi-role, Wallet, Indexes).
  - [ ] Create `seed.ts` to populate Master Data (Attributes, Roles, BillingPeriods).
  - [ ] Verify `npx prisma db push` works without errors.
- [ ] **Core Utilities**
  - [ ] Implement `Logger` (Winston).
  - [ ] Implement `AppError` & Global Error Handler.
  - [ ] Implement `ResponseHelper` (Standard JSON & Pagination).

---

## 🔐 Phase 1: Identity & Access Management (Week 1 - Days 3-5)

**Goal:** Enable user registration, secure authentication, and role-based access.

- [ ] **Auth Module**
  - [ ] `POST /auth/register`: Register as Tenant/Landlord (Auto-create Trust Profile & Wallet).
  - [ ] `POST /auth/login`: Issue JWT Access Token.
  - [ ] `GET /auth/me`: Get current user profile.
- [ ] **RBAC & Security**
  - [ ] Middleware: `verifyToken` (JWT Validation).
  - [ ] Middleware: `requireRole` & `can` (Check Redis/DB for Permissions).
  - [ ] Implement Rate Limiting (Helmet/Express-Rate-Limit).
- [ ] **Profile Management**
  - [ ] `PUT /users/profile`: Update name, phone (JSONB metadata).
  - [ ] **Storage Integration:** Upload Avatar to MinIO (**Public Bucket**).

---

## 🏠 Phase 2: Rental Marketplace Engine (Week 2)

**Goal:** Allow Landlords to list properties with dynamic specs and Tenants to search them.

- [ ] **Reference Data API**
  - [ ] `GET /references/attributes`: Fetch dynamic form inputs (Bedroom, Amenities list).
- [ ] **Property Management (Landlord)**
  - [ ] `POST /properties`: Create listing with EAV Attributes.
  - [ ] **Storage Integration:** Upload multiple Property Images (**Public Bucket**).
  - [ ] `PUT /properties/:id`: Update listing & attributes.
  - [ ] `DELETE /properties/:id`: Soft delete implementation.
- [ ] **Marketplace Search (Tenant)**
  - [ ] `GET /properties`: Public list with Pagination & Sorting.
  - [ ] Implement Filters: City, Price Range, Property Type.
  - [ ] `GET /properties/:id`: Detail view with full specs & Landlord info.
- [ ] **Favorites**
  - [ ] `POST /favorites/:propertyId`: Add/Remove from wishlist.

---

## 💸 Phase 3: Finance & Transaction System (Week 3)

**Goal:** Handle payments securely (Escrow Model), manage recurring billing, and handle payouts.

- [ ] **Booking Logic**
  - [ ] `POST /bookings`: Create booking request.
  - [ ] Validation: Ensure User != Landlord of the property.
- [ ] **Payment Gateway (Midtrans Integration)**
  - [ ] Service: Generate Snap Token & Redirect URL for Invoice.
  - [ ] `POST /webhooks/midtrans`: Handle notifications.
  - [ ] **Escrow Logic:** On Success -> Update Invoice `PAID` -> Credit Landlord's **Wallet** (minus Platform Fee).
- [ ] **Wallet System (Ledger)**
  - [ ] Service: `WalletService` to handle credit/debit transactions safely.
  - [ ] `GET /finance/wallet`: View balance and transaction history.
- [ ] **Payout & Withdrawal**
  - [ ] `POST /finance/bank-accounts`: Add/Edit bank details.
  - [ ] `POST /finance/withdraw`: Request payout from Wallet.
  - [ ] Admin: Logic to process payout (Manual Transfer or Midtrans Iris).
- [ ] **Recurring Billing (Scheduler)**
  - [ ] Setup `node-cron` worker (Runs daily).
  - [ ] Logic: Auto-generate Invoice for next billing cycle (H-7).

---

## 🛡️ Phase 4: Trust Engine & Safety (Week 4)

**Goal:** The core value proposition. Verify identities and calculate Trust Scores.

- [ ] **KYC System (Know Your Customer)**
  - [ ] **Storage Integration:** Upload KTP & Selfie (**Private Bucket**).
  - [ ] `POST /trust/kyc`: Submit documents.
  - [ ] `POST /admin/kyc/approve`: Admin verification logic (updates `ktpVerifiedAt`).
  - [ ] Middleware: `requireVerified` (Block booking/withdraw if KYC pending).
- [ ] **Trust Scoring Logic**
  - [ ] Service: `TrustService` with dynamic point configuration.
  - [ ] Listener: On `PAYMENT_PAID_ON_TIME` -> TTI Score ++.
  - [ ] Listener: On `PAYMENT_LATE` -> TTI Score --.
  - [ ] Listener: On `DISPUTE_LOST` -> LRS Score --.
- [ ] **Trust Dashboard API**
  - [ ] `GET /trust/my-score`: Current Score & Status.
  - [ ] `GET /trust/logs`: History of score changes (for Line Chart).

---

## 💬 Phase 5: Communication & Final Polish (Week 5)

**Goal:** Real-time interaction and system hardening.

- [ ] **Chat Module**
  - [ ] Setup Socket.io Server (with Redis Adapter).
  - [ ] `POST /chat/room`: Initiate chat from Property page.
  - [ ] `GET /chat/messages`: Load history with pagination.
- [ ] **Response Time Analytics**
  - [ ] Logic: Calculate delta between Tenant Message & Landlord Reply.
  - [ ] Event: Update LRS "Response Rate" score based on speed.
- [ ] **Optimization & Testing**
  - [ ] Database Indexing audit.
  - [ ] Final Security Audit (Headers, Input Validation).
  - [ ] Prepare `docker-compose.prod.yml` for deployment.
