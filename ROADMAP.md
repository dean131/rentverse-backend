# 🗺️ Rentverse Project Roadmap (v2.5 - Live Status)

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
**Status:** ✅ **COMPLETE**

- [x] **Property Management**
  - [x] `POST /properties`: Create listing with images (Public Bucket).
  - [x] **EAV Attributes:** Dynamic specs (Bedroom, WiFi, etc).
  - [x] **Portable Media:** DB stores relative paths; API returns full URLs dynamically.
- [x] **Mobile Search Feed**
  - [x] `GET /properties`: **Refactored to Infinite Scroll** (Cursor-based pagination).
  - [x] **Detail View:** `GET /properties/:id` implemented (Includes Landlord Profile).
  - [x] **Filters:** Search by City, Title, Price.
- [ ] **Engagement**
  - [ ] `POST /favorites/:id`: "Like" functionality.
  - [ ] `GET /favorites`: List liked properties.
- [x] **Booking System**
  - [x] `POST /bookings`: Create request (Returns details for "Review & Pay" screen).
  - [x] `GET /bookings`: "My Bookings" list with Search, Filter & Cursor Pagination.

---

## ⚖️ Phase 3: The Trust Engine
**Status:** 🚧 **IN PROGRESS** (Foundation ready, Logic pending)

- [x] **Data Model**
  - [x] `TrustLog` schema updated (Actor, Metadata, SourceType).
- [x] **Scoring Infrastructure**
  - [x] `TrustService` initialized.
  - [x] **Event Listener:** `AUTH:USER_REGISTERED` initializes score.
- [x] **Advanced Logic**
  - [x] **Payment Listener:** `PAYMENT:PAID` event rewards Tenant (+2.0 TTI).
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
**Status:** ✅ **COMPLETE**

- [x] **Payment Gateway (Midtrans)**
  - [x] `POST /payments/pay/:invoiceId`: Generate Snap Token.
  - [x] `POST /payments/webhook`: Handle Status Updates (Paid/Expired).
- [x] **Wallet System (Ledger)**
  - [x] `Wallet` & `WalletTransaction` Schema.
  - [x] **Rent Split Logic:** Automates 5% Platform Fee deduction.
  - [x] `GET /finance/wallet`: View Balance & History.
- [x] **Payouts**
  - [x] `POST /finance/payout`: Request withdrawal (Locks funds).

---

## 💬 Phase 5.5: Real-Time Communication
**Status:** 🚀 **NEXT UP**

- [ ] **Socket.IO Server:** Auth middleware & Connection handling.
- [ ] **Chat Module:**
  - [ ] `POST /chats/start`: Initiate conversation (Tenant -> Landlord).
  - [ ] `GET /chats`: List conversation history.
  - [ ] `GET /chats/:roomId/messages`: Load chat logs.
- [ ] **WhatsApp Integration (Evolution API):** Send OTPs & Alerts (Deferred).

---

## 🤖 Phase 6: AI Readiness
**Status:** 📅 **PLANNED** (Week 7+)

- [ ] **AI Data Pipeline:** Ensure `TrustLog.metadata` populates context.
- [ ] **Shadow Mode:** `isDraft` flag in logs for future AI suggestions.