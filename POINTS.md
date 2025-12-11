### **1. Automated System Rules**

These rules are defined in the database seed and triggered automatically by system events.

- **Payment on Time (Tenant):**
  - **Impact:** +2.0 points
  - **Trigger:** When a rent invoice is paid successfully.
  - **Source:** `trust.subscribers.ts`, `seed.ts`.
- **Late Payment (Tenant):**
  - **Impact:** -5.0 points
  - **Trigger:** Defined in system rules for when a payment is made after the due date.
  - **Source:** `seed.ts`, `README.md`.
- **Fast Response (Landlord):**
  - **Impact:** +3.0 points
  - **Trigger:** When a landlord replies to a tenant's first message within 30 minutes.
  - **Source:** `trust.subscribers.ts`, `seed.ts`.
- **KYC Verification (Tenant/Landlord):**
  - **Impact:** +10.0 points
  - **Trigger:** When an Admin verifies a user's Identity Card (KTP) and Selfie.
  - **Source:** `trust.subscribers.ts`, `seed.ts`.
- **Fake Listing (Landlord):**
  - **Impact:** -50.0 points
  - **Trigger:** Defined in rules for when a listing is flagged as fraudulent (likely triggered manually or by specific detection logic).
  - **Source:** `seed.ts`.

### **2. Dispute Resolutions**

When a dispute is resolved by an Admin, significant penalties are applied to the losing party.

- **Landlord Lost Dispute:**
  - **Impact:** -20.0 points
  - **Trigger:** Admin resolves a dispute with `REFUND_TENANT`.
  - **Source:** `dispute.service.ts`.
- **Tenant Lost Dispute:**
  - **Impact:** -15.0 points
  - **Trigger:** Admin resolves a dispute with `PAYOUT_LANDLORD`.
  - **Source:** `dispute.service.ts`, `seed.ts`.

### **3. Reviews & Ratings**

Users review each other after a booking. The star rating directly impacts the receiver's score.

- **5-Star Review:** +3.0 points
- **4-Star Review:** +1.0 points
- **3-Star Review:** 0.0 points (Neutral)
- **2-Star Review:** -3.0 points
- **1-Star Review:** -5.0 points

### **4. Administrative & Initialization**

- **User Registration:**
  - **Impact:** Score initialized to **50.0** (Neutral Start).
  - **Trigger:** New user account creation.
  - **Source:** `auth.repository.ts`.
- **Manual Adjustment:**
  - **Impact:** Variable (Admin decides the amount).
  - **Trigger:** Admin manually adjusts a score via the dashboard (e.g., for good behavior not captured by system or external issues).
  - **Source:** `trust.service.ts`, `admin.controller.ts`.
