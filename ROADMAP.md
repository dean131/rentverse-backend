# 🗺️ Rentverse Project Roadmap (v2.7 - Live Status)

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
  - [x] **Smart Alerts:** Welcome, Chat Message, and Booking Request notifications.
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
  - [x] `GET /properties`: **Infinite Scroll** (Cursor-based pagination).
  - [x] **Detail View:** `GET /properties/:id` implemented (Includes Landlord Profile).
  - [x] **Filters:** Search by City, Title, Price.
- [x] **Booking System**
  - [x] `POST /bookings`: Create request (Returns details for "Review & Pay" screen).
  - [x] `GET /bookings`: "My Bookings" list with Search, Filter & Cursor Pagination.
- [ ] **Engagement (Pending)**
  - [ ] `POST /favorites/:id`: "Like" functionality.
  - [ ] `GET /favorites`: List liked properties.

---

## ⚖️ Phase 3: The Trust Engine
**Status:** ✅ **CORE LOGIC COMPLETE** (Dashboard Pending)

- [x] **Data Model**
  - [x] `TrustLog` schema updated (Actor, Metadata, SourceType).
- [x] **Scoring Infrastructure**
  - [x] **Unit of Work Pattern:** Service handles transactions, Repository handles atomic DB ops.
  - [x] **Event Listener:** `AUTH:USER_REGISTERED` initializes score.
- [x] **Advanced Logic (Automated Rewards)**
  - [x] **Payment Listener:** `PAYMENT:PAID` event rewards Tenant (+2.0 TTI).
  - [x] **Chat Listener:** `CHAT:MESSAGE_SENT` rewards Landlord (+1.0 LRS) for <30m response.
- [ ] **Trust Dashboard (Mobile)**
  - [ ] `GET /trust/history`: API for the mobile score graph.

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
**Status:** ✅ **COMPLETE**

- [x] **Socket.IO Server:**
  - [x] JWT Authentication Middleware.
  - [x] **Hybrid Sync:** Broadcasts to Chat Room (Active Screen) + Personal Channel (Inbox List).
- [x] **Chat Module (REST API):**
  - [x] `POST /chats/start`: Initiate conversation (Idempotent).
  - [x] `GET /chats`: List conversation history (Cursor Pagination).
  - [x] `GET /chats/:roomId/messages`: Load chat logs (Cursor Pagination).

---

## 🛡️ Phase 4: Admin Dashboard & Overrides
**Status:** 🚀 **NEXT UP** (Week 5)

- [ ] **User Management**
  - [ ] `GET /admin/users`: Table view (Filters: Role, KYC Status, Trust Score).
- [ ] **Trust Governance**
  - [ ] `POST /admin/trust/adjust`: Manual override with audit log (e.g., "Good behavior bonus").
  - [ ] `POST /admin/users/:id/verify`: Approve/Reject KYC documents.
- [ ] **Disputes**
  - [ ] `POST /disputes/resolve`: Specialized override for resolving booking conflicts.

---

## 🤖 Phase 6: AI Readiness
**Status:** 📅 **PLANNED** (Week 7+)

- [ ] **AI Data Pipeline:** Ensure `TrustLog.metadata` populates context.
- [ ] **Shadow Mode:** `isDraft` flag in logs for future AI suggestions.