### 🗺️ Rentverse Project Roadmap (v2.2 - Live Status)

**Current Focus:** Closing Phase 1 (KYC) and Phase 2 (Favorites/Booking).

---

#### 🏁 Phase 0: Foundation & Infrastructure

**Status:** ✅ **COMPLETE**

- [x] **Project Initialization** (Node.js 24, Modular Monolith).
- [x] **Containerization** (Docker, Postgres 15, Redis, MinIO).
- [x] **Database** (Prisma Schema v6 with EAV & Trust Ledger).
- [x] **Unified API Standard** (`ResponseHelper`, `AppError`, `EventBus`).

---

#### 📱 Phase 1: Identity, Auth & Notifications

**Status:** 🚧 **IN PROGRESS** (Auth & Notifications done, KYC pending)

- [x] **Auth Module**
  - [x] `POST /auth/register` & `POST /auth/login`.
  - [x] **Device Registration:** `POST /notifications/device` (FCM Token handling).
  - [ ] `POST /auth/refresh`: Token rotation logic.
- [x] **Push Notification System**
  - [x] `NotificationModule` decoupled via Event Bus.
  - [x] `NotificationService` (Firebase Admin SDK wrapper).
  - [x] **Welcome Alert:** Auto-sends push notification on registration.
- [ ] **KYC System (Secure Storage)**
  - [ ] **Private Bucket:** Configure MinIO for private access.
  - [ ] `POST /kyc/upload`: Handle ID Card upload & generate signed URLs.

---

#### 🏠 Phase 2: Rental Marketplace API

**Status:** 🚧 **IN PROGRESS** (Feed done, Engagement pending)

- [x] **Property Management**
  - [x] `POST /properties`: Create listing with images.
  - [x] **EAV Attributes:** Dynamic specs (Bedroom, WiFi, etc).
- [x] **Mobile Search Feed**
  - [x] `GET /properties`: **Refactored to Infinite Scroll** (Cursor-based).
  - [x] **Filters:** Search by City, Title, Price.
- [ ] **Engagement**
  - [ ] `POST /favorites/:id`: "Like" functionality.
  - [ ] `GET /favorites`: List liked properties.
- [ ] **Booking Request**
  - [ ] `POST /bookings`: Initiate a rental request.

---

#### ⚖️ Phase 3: The Trust Engine

**Status:** 🚧 **IN PROGRESS** (Foundation ready, Logic pending)

- [x] **Data Model**
  - [x] `TrustLog` schema updated (Actor, Metadata, SourceType).
- [x] **Scoring Infrastructure**
  - [x] `TrustService` initialized.
  - [x] **Event Listener:** `AUTH:USER_REGISTERED` initializes score.
- [ ] **Advanced Logic**
  - [ ] **Payment Listener:** Update TTI on payment success/failure.
  - [ ] **Chat Listener:** Update LRS on fast response.
- [ ] **Trust Dashboard**
  - [ ] `GET /trust/history`: API for the mobile score graph.

---

#### 🛡️ Phase 4: Admin Dashboard & Overrides

**Status:** 📅 **PLANNED** (Week 5)

- [ ] `GET /admin/users`: Table view with Scores.
- [ ] `POST /admin/trust/adjust`: Manual override with audit log.
- [ ] `POST /disputes/resolve`: Dispute handling.

#### 💸 Phase 5: Finance & Escrow

**Status:** 📅 **PLANNED** (Week 6)

- [ ] Midtrans Snap Integration.
- [ ] Wallet System (Ledger).
- [ ] Payout Requests.

---
