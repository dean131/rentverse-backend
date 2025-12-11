### **1. Automated System Events**
These are triggered automatically by user actions within the platform.

| **Role** | **Event / Action** | **Impact** | **Trigger Condition** |
| :--- | :--- | :--- | :--- |
| **Tenant** | **Rent Paid On Time** | **+2.0** | Triggered when an invoice is successfully paid via Midtrans. |
| **Tenant** | **KYC Verified** | **+10.0** | Awarded when an Admin approves the submitted ID card and selfie. |
| **Landlord** | **Fast Response** | **+3.0** | Awarded for replying to a new tenant message within **30 minutes**. |

### **2. Dispute Resolutions (Penalties)**
When a dispute is resolved by an Admin, significant penalties are applied to the losing party.

| **Role** | **Outcome** | **Impact** | **Logic** |
| :--- | :--- | :--- | :--- |
| **Landlord** | **Lost Dispute** | **-20.0** | Applied if the resolution is `REFUND_TENANT` (e.g., property not as described). |
| **Tenant** | **Lost Dispute** | **-15.0** | Applied if the resolution is `PAYOUT_LANDLORD` (e.g., false claim or damage). |

### **3. Admin Governance & Manual Overrides**
Admins have the authority to manually adjust scores for specific violations or rewards.

| **Role** | **Event** | **Impact** | **Description** |
| :--- | :--- | :--- | :--- |
| **Any** | **Manual Adjustment** | **Variable** | Admins can add or deduct any amount (e.g., +5 or -10) with a custom reason via the Admin Dashboard. |
| **Landlord** | **Fake Listing** | **-50.0** | A severe penalty defined in the system rules for fraud prevention, typically applied manually by Admins. |

### **4. Defined Rules (Implementation Pending)**
These rules exist in the database configuration but do not have active automated triggers in the provided code snippets (likely handled by scheduled jobs or future updates).

* **Tenant - Late Payment:** **-5.0 points** (Event: `PAYMENT_LATE`).