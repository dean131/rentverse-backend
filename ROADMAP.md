# 🗺️ Rentverse Project Roadmap (v2.4 - Live Status)

**Core Shift:** Mobile-First for Users (Tenant/Landlord) | Web-Based for Admin Operations.
**Focus:** Secure Identity, Trust Engine Accuracy, and High-Performance Mobile Feed.

---

## 🏁 Phase 0: Foundation & Infrastructure (Week 1)
**Status:** ✅ **COMPLETE**

- [x] **Project Initialization** (Node.js 24 + TS, Modular Monolith).
- [x] **Containerization** (Docker, Postgres 15, Redis, MinIO).
- [x] **Database** (Prisma Schema v6 with EAV & Trust Ledger).
- [x] **Unified API Standard** (`ResponseHelper`, `AppError`, `EventBus`).

---

## 📱 Phase 1: Identity, Auth & Notifications (Week 2)
**Status:** ✅ **COMPLETE**

- [x] **Secure Auth Module**
  - [x] `POST /auth/register` & `POST /auth/login`.
  - [x] **Session Management:** Hybrid System (Stateless Access Token + Stateful Refresh Token).
  - [x] **Token Rotation:** `POST /auth/refresh` with Redis backing for theft detection.
- [x] **Push Notification System**
  - [x] `NotificationModule` decoupled via Event Bus.
  - [x] `POST /notifications/device`: Store/Update FCM Device Tokens.
  - [x] **Welcome Alert:** Auto-sends push notification on registration.
- [x] **KYC System (Secure Storage)**
  - [x] **Private Bucket:** Configure MinIO for private access (ID Cards).
  - [x] `POST /kyc/upload`: Multipart upload & signed URL generation.
  - [x] **Verification Logic:** Service to update Trust Profile status.

---

## 🏠 Phase 2: Rental Marketplace API (Week 3)
**Status:** 🚧 **IN PROGRESS** (Feed done, Engagement pending)

- [x] **Property Management**
  - [x] `POST /properties`: Create listing with images (Public Bucket).
  - [x] **EAV Attributes:** Dynamic specs (Bedroom, WiFi, etc).
  - [x] **Portable Media:** DB stores relative paths; API returns full URLs dynamically.
- [x] **Mobile Search Feed**
  - [x] `GET /properties`: **Refactored to Infinite Scroll** (Cursor-based pagination).
  - [x] **Detail View:** `GET /properties/:id` implemented.
  - [x] **Filters:** Search by City, Title, Price.
- [ ] **Engagement**
  - [ ] `POST /favorites/:id`: "Like" functionality.
  - [ ] `GET /favorites`: List liked properties.
- [ ] **Booking Request**
  - [ ] `POST /bookings`: Initiate a rental request (Requires KYC Verified status).

---

## ⚖️ Phase 3: The Trust Engine
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

## 🛡️ Phase 4: Admin Dashboard & Overrides
**Status:** 📅 **PLANNED** (Week 5)

- [ ] `GET /admin/users`: Table view with Scores.
- [ ] `POST /admin/trust/adjust`: Manual override with audit log.
- [ ] `POST /disputes/resolve`: Dispute handling.

---

## 💸 Phase 5: Finance & Escrow
**Status:** 📅 **PLANNED** (Week 6)

- [ ] Midtrans Snap Integration.
- [ ] Wallet System (Ledger).
- [ ] Payout Requests.

---

## 🤖 Phase 6: AI Readiness
**Status:** 📅 **PLANNED** (Week 7+)

- [ ] **AI Data Pipeline:** Ensure `TrustLog.metadata` populates context.
- [ ] **Shadow Mode:** `isDraft` flag in logs for future AI suggestions.