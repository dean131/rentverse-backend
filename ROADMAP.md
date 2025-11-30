### 🏁 Phase 0: Infrastructure & Foundation (Sudah Selesai)
*Status: Ready to Code*
* [x] Setup Project (Node 24, TS, Express).
* [x] Setup Docker (App, PG, Redis, MinIO).
* [x] Final Database Schema (Normalized).
* [x] Base Config (Logger, Prisma, Swagger, Zod).

---

### 📅 Phase 1: Identity & Access (Minggu 1)
**Fokus:** Memastikan user bisa masuk dan sistem tahu siapa mereka (RBAC).

**Tasks:**
1.  **Seeding Data Master:**
    * Jalankan `npm run db:seed` untuk mengisi tabel `Roles`, `PropertyType`, `TrustEvent`, dll. *Tanpa ini aplikasi error.*
2.  **Auth Service:**
    * Implementasi Register (User + Role + Auto-create Trust Profile).
    * Implementasi Login (Generate JWT).
3.  **RBAC Middleware:**
    * Implementasi logika cek Redis untuk Permission.
    * Buat decorator/middleware `@Can('trust.score.update')`.
4.  **Storage Service:**
    * Implementasi upload file ke MinIO (Public untuk Avatar).
    * Update profil user (Upload Avatar).

**Definition of Done:**
* Bisa Register sebagai Tenant & Landlord via Swagger.
* Bisa Login dan dapat JWT Token.
* Admin bisa login (akun dari seeder).

---

### 📅 Phase 2: Rental Marketplace (Minggu 2)
**Fokus:** Produk utama. Landlord posting, Tenant searching.

**Tasks:**
1.  **Property CRUD:**
    * Create Property (Wajib validasi Zod untuk `amenities`, `location`).
    * Upload Foto Properti (Multiple upload ke MinIO Public).
2.  **Search & Filter:**
    * Implementasi `GET /properties` dengan filter (City, Price Range, Type).
    * Implementasi Pagination helper.
3.  **Favorites:**
    * Add/Remove to Wishlist.

**Definition of Done:**
* Landlord bisa membuat listing properti lengkap dengan foto.
* Tenant bisa mencari properti berdasarkan kota dan harga.
* Response API menggunakan format standar (`data`, `meta`).

---

### 📅 Phase 3: Transaction Engine (Minggu 3)
**Fokus:** Uang masuk, Status Booking berubah. Ini bagian paling kritis.

**Tasks:**
1.  **Booking Logic:**
    * Tenant melakukan Booking (Pilih `BillingPeriod`).
    * Validasi: Cek ketersediaan tanggal.
2.  **Payment Integration (Midtrans):**
    * Generate Invoice pertama saat Booking.
    * Integrasi `midtrans-client` (Snap API).
3.  **Webhook Handler:**
    * Buat endpoint untuk menerima notifikasi Midtrans.
    * Update status Invoice (`PENDING` -> `PAID`).
    * Update status Booking (`ACTIVE`).
4.  **Recurring Scheduler:**
    * Setup `node-cron` untuk cek H-7 jatuh tempo.
    * Auto-generate invoice baru untuk bulan depan.

**Definition of Done:**
* Tenant bisa checkout dan muncul pop-up Midtrans (Mock/Sandbox).
* Setelah bayar, status di database otomatis berubah jadi PAID.
* Cron job berjalan dan tidak error.

---

### 📅 Phase 4: Trust Engine & KYC (Minggu 4)
**Fokus:** Nilai jual utama ("Real Analytical Thinking").

**Tasks:**
1.  **KYC System:**
    * Upload KTP & Selfie (MinIO Private).
    * Admin Approval Endpoint.
    * Middleware `requireVerified` dipasang di Booking.
2.  **Trust Logic (The Brain):**
    * Implementasi `TrustService`.
    * Logic perhitungan TTI & LRS.
3.  **Event Listeners:**
    * Bind event `PAYMENT_PAID` -> Trigger `PAYMENT_ON_TIME` (+Skor).
    * Bind event `PAYMENT_LATE` -> Trigger `PAYMENT_LATE` (-Skor).
4.  **Logs API:**
    * Endpoint untuk melihat history skor (untuk Grafik Dashboard UI).

**Definition of Done:**
* User harus KYC dulu baru bisa booking.
* Skor TTI naik otomatis saat simulasi bayar sukses.
* Skor LRS turun otomatis jika ada report sengketa.

---

### 📅 Phase 5: Chat & Final Polish (Minggu 5)
**Fokus:** Interaksi user dan kestabilan sistem.

**Tasks:**
1.  **Chat Module:**
    * Setup Socket.io.
    * API `GET /chat/rooms` dan `GET /chat/messages`.
2.  **Response Time Analytics:**
    * Logic menghitung selisih waktu balas chat Landlord.
    * Update LRS Score berdasarkan kecepatan balas.
3.  **Security & Optimization:**
    * Cek Rate Limiting.
    * Cek Indexing Database (Explain Analyze query berat).
4.  **Deployment:**
    * Push Docker Image ke Registry (jika ada).
    * Final Test di environment Staging/Prod.

**Definition of Done:**
* Chat real-time berfungsi.
* Semua endpoint terdocumentasi di Swagger.
* Tidak ada error di logs Winston.

---

### 🚀 Prioritas Pengerjaan (Critical Path)

Jika waktu mepet, kerjakan urutan ini dan abaikan sisanya:
1.  **Auth** (Tanpa ini tidak ada user).
2.  **Rental** (Tanpa ini tidak ada produk).
3.  **Booking/Payment** (Tanpa ini tidak ada bisnis).
4.  **Trust Score** (Tanpa ini tidak sesuai dokumen tantangan).
5.  *Chat* (Bisa ditunda/dihapus).
6.  *Recurring Scheduler* (Bisa manual trigger dulu).