# 🗺️ Rentverse Project Roadmap

This document outlines the development stages for the **Rentverse Backend API**.
It follows a **Modular Monolith** approach, prioritizing foundational stability (Infrastructure) before moving to complex business logic (Trust Scoring).

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
    - [x] Create `docker-compose.yml` (App, Postgres 15, Redis, MinIO).
    - [ ] Verify Healthchecks for all containers.
- [ ] **Database & Seeding (CRITICAL)**
    - [x] Define Prisma Schema v3.1 (EAV, Multi-role, Indexes).
    - [ ] Create `seed.ts` to populate Master Data (PropertyAttributes, Roles, BillingPeriods).
    - [ ] Verify `npx prisma db push` works without errors.
- [ ] **Core Utilities**
    - [ ] Implement `Logger` (Winston).
    - [ ] Implement `AppError` & Global Error Handler.
    - [ ] Implement `ResponseHelper` (Standard JSON & Pagination).
    - [ ] Setup `Swagger` base configuration.

---

## 🔐 Phase 1: Identity & Access Management (Week 1 - Days 3-5)
**Goal:** Enable user registration, secure authentication, and role-based access.

- [ ] **Auth Module**
    - [ ] `POST /auth/register`: Register as Tenant/Landlord (Auto-create Trust Profile).
    - [ ] `POST /auth/login`: Issue JWT Access Token.
    - [ ] `POST /auth/refresh-token`: (Optional) Rotate tokens.
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
    - [ ] `GET /references/attributes`: Fetch dynamic form inputs (Bedroom, Amenities list) for Frontend.
- [ ] **Property Management (Landlord)**
    - [ ] `POST /properties`: Create listing with EAV Attributes (`{ attributes: [{ id: 1, value: "3" }] }`).
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

## 💸 Phase 3: Transaction & Payment System (Week 3)
**Goal:** Handle money securely using Midtrans and manage recurring billing cycles.

- [ ] **Booking Logic**
    - [ ] `POST /bookings`: Create booking request (Check availability).
    - [ ] **Validation:** Ensure User != Landlord of the property.
- [ ] **Payment Gateway (Midtrans)**
    - [ ] Service: Generate Snap Token & Redirect URL.
    - [ ] `POST /webhooks/midtrans`: Handle notifications (Update Invoice `PAID` -> Update Booking `ACTIVE`).
    - [ ] Idempotency Check: Prevent double processing of webhooks.
- [ ] **Recurring Billing (Scheduler)**
    - [ ] Setup `node-cron` worker (Runs daily at 00:00).
    - [ ] Logic: Find active bookings approaching `nextPaymentDate` (H-7).
    - [ ] Action: Auto-generate Invoice & Send Notification (Email/Push).

---

## 🛡️ Phase 4: Trust Engine & Safety (Week 4)
**Goal:** The core value proposition. Verify identities and calculate Trust Scores.

- [ ] **KYC System (Know Your Customer)**
    - [ ] **Storage Integration:** Upload KTP & Selfie (**Private Bucket**).
    - [ ] `POST /trust/kyc`: Submit documents.
    - [ ] `POST /admin/kyc/approve`: Admin verification logic.
    - [ ] Middleware: `requireVerified` (Block booking if KYC pending).
- [ ] **Trust Scoring Logic**
    - [ ] Service: `TrustService` with dynamic point configuration from DB.
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
    - [ ] Setup Socket.io Server (with Redis Adapter for scaling).
    - [ ] `POST /chat/room`: Initiate chat from Property page.
    - [ ] `GET /chat/messages`: Load history with pagination.
- [ ] **Response Time Analytics**
    - [ ] Logic: Calculate delta between Tenant Message & Landlord Reply.
    - [ ] Event: Update LRS "Response Rate" score based on speed.
- [ ] **Optimization & Testing**
    - [ ] Database Indexing audit (`EXPLAIN ANALYZE`).
    - [ ] API Load Testing (k6 or Apache Benchmark).
    - [ ] Final Security Audit (Headers, Input Validation, Presigned URLs).

---

## 📦 Future Considerations (Post-MVP)
- [ ] **Sales Module:** Buying/Selling properties.
- [ ] **Review System:** Manual text reviews (Subjective data).
- [ ] **Notification Service:** Email (SendGrid) & Push Notifications (FCM).
- [ ] **Testing:** Unit Tests (Jest) & Integration Tests.
