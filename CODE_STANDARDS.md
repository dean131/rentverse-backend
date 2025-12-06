# 📘 Rentverse Code Standards & Architecture

This document outlines the architectural patterns, coding conventions, and best practices strictly enforced in the **Rentverse** backend.

**Core Philosophy:**

> "Write code that is easy to delete."
> We prioritize **Modularity**, **Type Safety**, and **Predictability** over clever one-liners.

---

## 1\. 🏗️ Architecture: Modular Monolith

We use a **Domain-Driven Modular Monolith** architecture. This structure mimics Microservices but deployed as a single unit, facilitating easy splitting in the future.

### Directory Structure

Code is organized by **Business Domain**, not by technical layer.

```text
src/
├── modules/
│   ├── auth/           # Domain: Identity & Access
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts
│   │   └── auth.routes.ts
│   ├── rental/         # Domain: Properties & Listings
│   └── trust/          # Domain: Scoring Engine
├── shared/             # Shared Utilities (AppError, EventBus)
└── config/             # Environment & Setup (Env, Redis, Prisma)
```

### The "Zero Import" Rule

- **Rule:** A module (e.g., `Auth`) **MUST NOT** directly import code from another module (e.g., `Trust`).
- **Solution:** Use the **Internal Event Bus** (`src/shared/bus/event-bus.ts`) to communicate between modules.
  - _Bad:_ `TrustService.updateScore(userId)` called inside AuthService.
  - _Good:_ `EventBus.publish('AUTH:USER_REGISTERED', { userId })`.

---

## 2\. 🏛️ Design Pattern: C-S-R

We strictly follow the **Controller-Service-Repository** separation of concerns.

### 1\. Controller (`*.controller.ts`)

- **Role:** The "HTTP Layer".
- **Responsibilities:**
  - Validate inputs (using Zod middleware).
  - Extract data from `req.body`, `req.query`, or `req.user`.
  - Call the **Service**.
  - Format the response using `sendSuccess()`.
- **Forbidden:** Business logic, Database queries.

### 2\. Service (`*.service.ts`)

- **Role:** The "Business Brain".
- **Responsibilities:**
  - Business rules (e.g., "User must be Verified to book").
  - Calculations.
  - Orchestrating calls to Repositories or External APIs (Midtrans, Firebase).
- **Forbidden:** Direct HTTP interaction (`req`, `res`), Direct DB queries (delegate to Repo).

### 3\. Repository (`*.repository.ts`)

- **Role:** The "Data Access Layer".
- **Responsibilities:**
  - Direct `prisma` calls.
  - Handling Transactions (`prisma.$transaction`).
  - Data mapping/formatting for the DB.
- **Forbidden:** Business validation.

---

## 3\. 📝 Coding Conventions

### A. Strict Type Safety

- **No `any`:** Avoid `any` at all costs. Use `unknown` if unsure, or define a DTO.
- **Zod Everywhere:** All runtime input (Body, Query, Params, Env Vars) must be validated with **Zod** schemas.

### B. Async & Error Handling

- **No `try-catch` in Controllers:** Use the `catchAsync` wrapper.
  ```typescript
  // ✅ Correct
  const login = catchAsync(async (req, res) => { ... });
  ```
- **Standard Errors:** Throw `AppError` for operational errors.
  ```typescript
  throw new AppError("Insufficient funds", 402);
  ```
- **Global Handler:** All errors are caught by `error.middleware.ts` which standardizes the JSON response.

### C. Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `user-profile.controller.ts`) or `camelCase.ts` depending on type (we use `camelCase` for class files like `auth.service.ts`).
- **Classes:** `PascalCase` (e.g., `AuthService`).
- **Instances:** `camelCase` (e.g., `authService`).
- **Interfaces/Types:** `PascalCase` (e.g., `CreateUserDTO`).
- **Events:** `DOMAIN:ACTION_NAME` (e.g., `AUTH:USER_REGISTERED`).

### D. Configuration

- **No `process.env` in Logic:** Never access `process.env.MY_KEY` directly in services or controllers.
- **Use `src/config/env.ts`:** Import the validated `env` object.
  ```typescript
  // ✅ Correct
  import { env } from "../../config/env";
  console.log(env.PORT);
  ```

---

## 4\. 💾 Database (Prisma)

- **Schema First:** Changes start in `schema.prisma`, then run `npx prisma db push`.
- **Seeding:** Reference data (Roles, AttributeTypes) must be seeded via `prisma/seed.ts`.
- **EAV Pattern:** Property attributes are dynamic. Do not add columns like `hasWifi` to the `Property` table. Use the `PropertyAttribute` relation.

---

## 5\. 🔌 API Standards

### JSON Response Format

All endpoints must return a consistent structure using `ResponseHelper`.

**Success:**

```json
{
  "status": "success",
  "message": "User registered",
  "data": { ... }
}
```

**Paginated/Infinite List:**

```json
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "limit": 10,
    "nextCursor": "uuid-string",
    "hasMore": true
  }
}
```

**Error:**

```json
{
  "status": "error", // or "fail" for 4xx
  "message": "Invalid email format"
}
```

---

## 6\. 🧪 Git & Workflow

- **Branching:** Use feature branches (`feature/kyc-upload`, `fix/login-bug`).
- **Commits:** Use conventional commits.
  - `feat: add kyc upload endpoint`
  - `fix: resolve null pointer in trust service`
  - `chore: update dependencies`
- **Secrets:** Never commit `.env` or `firebase-service-account.json`. Ensure they are in `.gitignore`.

---

### ✅ Checklist for New Features

Before submitting a PR, ensure:

1.  [ ] Logic is separated into Controller/Service/Repo.
2.  [ ] Zod schema exists for input validation.
3.  [ ] No direct imports from other modules (Used Event Bus?).
4.  [ ] `env` variables are defined in `config/env.ts`.
5.  [ ] Code builds (`npm run build`) and lints (`npm run lint`).
