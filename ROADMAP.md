# 🗺️ Rentverse Project Roadmap (v3.1 - Admin Focus)

**Current Status:** Landlord Operations are live. Now building internal Admin Tools.
**Focus:** User Verification, Trust Governance, and Dispute Resolution.

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
- [x] **Push Notification System**
  - [x] `POST /notifications/device`: Store FCM Device Tokens.
  - [x] **Smart Alerts:** Welcome, Chat Message, and Booking Request.
- [x] **KYC System**
  - [x] `POST /kyc/upload`: Private MinIO bucket for ID cards.

---

## 🏠 Phase 2: Rental Marketplace API (Week 3)

**Status:** ✅ **COMPLETE**

- [x] **Property Management**
  - [x] `POST /properties`: Create listing with images.
  - [x] **EAV Attributes:** Dynamic specs (Bedroom, WiFi, etc).
- [x] **Mobile Search Feed**
  - [x] `GET /properties`: Infinite Scroll Feed (Public View).
  - [x] `GET /properties/:id`: Detail View.
- [x] **Booking System**
  - [x] `POST /bookings`: Create request.
  - [x] `GET /bookings`: "My Bookings" list (Tenant View).

---

## ⚖️ Phase 3: The Trust Engine

**Status:** ✅ **CORE LOGIC COMPLETE**

- [x] **Scoring Infrastructure**
  - [x] `TrustService` & `TrustRepository` (Unit of Work Pattern).
  - [x] **Event Listener:** `AUTH:USER_REGISTERED` initializes score.
- [x] **Automated Rewards**
  - [x] `PAYMENT:PAID`: Tenant Reward (+2.0 TTI).
  - [x] `CHAT:MESSAGE_SENT`: Landlord Reward (+1.0 LRS) for fast response.

---

## 💬 Phase 5.5: Real-Time Communication

**Status:** ✅ **COMPLETE**

- [x] **Socket.IO Server:** Real-time messages & Inbox updates.
- [x] **Chat Module:** `POST /start`, `GET /history`.

---

## 🔑 Phase 2.5: Landlord Operations (Supply Side)

**Status:** ✅ **COMPLETE** (Week 5)

- [x] **Landlord Dashboard**
  - [x] `GET /landlord/dashboard`: Stats (Total Income, Active Bookings, LRS Score).
- [x] **Inventory Management**
  - [x] `GET /landlord/properties`: "My Listings" (Private view with Stats).
  - [x] `PATCH /properties/:id`: Update listing metadata.
  - [x] `DELETE /properties/:id`: Soft delete listing.
- [x] **Booking Control**
  - [x] `POST /bookings/:id/confirm`: Manual approval with notification.
  - [x] `POST /bookings/:id/reject`: Decline request with reason & notification.

---

## 🛡️ Phase 4: Admin Dashboard & Overrides

**Status:** 🚀 **NEXT UP** (Week 6)

- [ ] **User Management**
  - [ ] `GET /admin/users`: Table view (Filters: Role, KYC Status, Trust Score).
  - [ ] `GET /admin/users/:id`: Detailed profile view.
- [ ] **Trust Governance**
  - [ ] `POST /admin/users/:id/verify`: Approve/Reject KYC documents.
  - [ ] `POST /admin/trust/adjust`: Manual score override (with audit log).
- [ ] **Disputes & Resolutions**
  - [ ] `POST /disputes/resolve`: Force cancel booking & refund (if applicable).

---

## 🤖 Phase 6: AI Readiness

**Status:** 📅 **PLANNED**

- [ ] **Shadow Mode:** `isDraft` flag in logs for future AI suggestions.
- [ ] **Data Pipeline:** Export anonymized `TrustLog` for model training.
