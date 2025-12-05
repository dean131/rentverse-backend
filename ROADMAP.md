# 🗺️ Rentverse Project Roadmap (v2.1 - Mobile First + Notifications)

**Core Shift:** Mobile-First for Users (Tenant/Landlord) | Web-Based for Admin Operations.
**Focus:** Trust Engine Accuracy, Unified API, Push Notifications, and AI Readiness.

---

## 🏁 Phase 0: Foundation & Infrastructure (Week 1)

**Goal:** Establish a stable, containerized environment ready for mobile API consumption.

- [x] **Project Initialization**
  - [x] Setup Node.js 24 + TS, ESLint, Prettier.
  - [x] Configure Folder Structure (Modular Monolith).
- [x] **Containerization**
  - [x] Docker & Compose (App, Postgres 15, Redis, MinIO).
  - [x] Healthchecks & Hot-Reload.
- [x] **Database & Seeding**
  - [x] Prisma Schema v6 (EAV Pattern, Trust Engine).
  - [x] Initial Seeders (Roles, Attributes).
- [ ] **Unified API Standard**
  - [ ] Implement `ResponseHelper` for consistent JSON (Critical for Mobile parsing).
  - [ ] Implement Global Error Handling (No silent failures).

---

## 📱 Phase 1: Identity, Auth & Notifications (Week 2)

**Goal:** Secure mobile authentication and establishing the communication channel.

- [ ] **Auth Module (Mobile Optimized)**
  - [ ] `POST /auth/register`: Auto-create User + Role + Trust Profile.
  - [ ] `POST /auth/login`: Issue long-lived JWT (for Keychain storage).
  - [ ] `POST /auth/refresh`: Token rotation logic.
- [ ] **Push Notification Infrastructure (FCM)**
  - [ ] **Setup:** Configure Firebase Admin SDK.
  - [ ] **Device Management:** `POST /notifications/device`: Store/Update FCM Device Tokens in Redis/DB.
  - [ ] **Service:** Create `NotificationService` to handle `sendToUser(userId, payload)`.
- [ ] **KYC System (Secure Storage)**
  - [ ] **Private Bucket:** MinIO setup for private docs (ID Cards).
  - [ ] `POST /kyc/upload`: Multipart upload & signed URL generation.

---

## 🏠 Phase 2: Rental Marketplace API (Week 3)

**Goal:** Serve dynamic property data to the mobile feed.

- [ ] **Property Management (Landlord Mobile Flow)**
  - [ ] `POST /properties`: Multi-step form submission.
  - [ ] **Image Optimization:** Middleware to resize/compress images for mobile bandwidth.
- [ ] **Search & Discovery (Tenant Mobile Flow)**
  - [ ] `GET /properties`: High-performance feed with Cursor-based pagination.
  - [ ] **Advanced Filters:** EAV filtering (e.g., "Has AC", "Pet Friendly").
  - [ ] `POST /favorites`: "Like" functionality.
- [ ] **Booking Request**
  - [ ] `POST /bookings`: Initiate booking.
  - [ ] **Notification:** Trigger "New Booking Request" push to Landlord.

---

## ⚖️ Phase 3: The Trust Engine & Engagement (Week 4)

**Goal:** The mathematical backbone. Calculate scores and notify users of changes.

- [ ] **Trust Data Model Upgrade**
  - [ ] Refactor `TrustLog` (Actor, SourceType, Metadata) - *Done in Schema*.
  - [ ] Seed `TrustEvents` (Rules): Late Payment (-5), Fast Response (+2).
- [ ] **Scoring Logic Implementation**
  - [ ] Service: `TrustScoreService` for atomic updates.
  - [ ] **Event Listeners:**
    - [ ] `PaymentSuccess` -> `TrustScoreService.addLog()`.
    - [ ] `ChatResponse` -> Calculate delta -> Update LRS.
- [ ] **Trust Notifications (The Feedback Loop)**
  - [ ] **Alert:** Send Push Notification when Score changes (e.g., "⚠️ Score Dropped: Late Payment").
  - [ ] **Dashboard:** `GET /trust/history` for Mobile "Score Timeline" graph.

---

## 🛡️ Phase 4: Admin Dashboard & Overrides (Week 5)

**Goal:** Power the Web Admin Panel to manage disputes and oversee the system.

- [ ] **Admin Tools API**
  - [ ] `GET /admin/users`: Enhanced table view with TTI/LRS columns.
  - [ ] **Score Override System:** `POST /admin/trust/adjust`.
    - [ ] Logic: Create `TrustLog` with `actor: ADMIN`.
    - [ ] Notification: Push "Admin adjusted your score" to User.
- [ ] **Dispute Management**
  - [ ] `POST /disputes`: API for Mobile filing.
  - [ ] **Resolution Workflow:** Admin accepts/rejects -> System auto-adjusts scores.

---

## 💸 Phase 5: Finance & Payment Gateway (Week 6)

**Goal:** Secure transaction handling with automated trust scoring.

- [ ] **Midtrans Integration**
  - [ ] `POST /booking/checkout`: Generate Snap Token for Mobile SDK.
  - [ ] **Webhooks:** Secure endpoint for status updates (`settlement`, `expire`).
- [ ] **Escrow Logic**
  - [ ] **Wallet System:** Hold funds until `STAY_COMPLETED`.
  - [ ] **Payouts:** `POST /payouts/request` for Landlords.
  - [ ] **Notification:** Push "Payment Received" / "Payout Processed".

---

## 🤖 Phase 6: AI Readiness & Polish (Week 7+)

**Goal:** Prepare data structures for Agentic AI and harden security.

- [ ] **AI Data Pipeline**
  - [ ] Ensure `TrustLog.metadata` populates rich context (latency, sentiment).
  - [ ] **Shadow Mode:** `isDraft` flag in logs for future AI suggestions.
- [ ] **System Hardening**
  - [ ] Rate Limiting (Strict rules for Mobile API).
  - [ ] Input Sanitization & Helmet Security Headers.
  - [ ] Load Testing.