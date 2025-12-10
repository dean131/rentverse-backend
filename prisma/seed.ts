import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedReferences() {
  console.log("🌱 [Seed] Reference Data...");

  // 1. Property Types
  const propTypes = [
    { slug: "apartment", label: "Apartment" },
    { slug: "house", label: "House" },
    { slug: "condo", label: "Condominium" },
    { slug: "townhouse", label: "Townhouse" },
    { slug: "villa", label: "Villa" },
    { slug: "room", label: "Room (Kost)" },
  ];
  for (const pt of propTypes) {
    await prisma.propertyType.upsert({
      where: { slug: pt.slug },
      update: {},
      create: pt,
    });
  }

  // 2. Listing Types
  const listTypes = [
    { slug: "rent", label: "For Rent" },
    { slug: "sale", label: "For Sale" },
  ];
  for (const lt of listTypes) {
    await prisma.listingType.upsert({
      where: { slug: lt.slug },
      update: {},
      create: lt,
    });
  }

  // 3. Billing Periods
  const billPeriods = [
    { slug: "monthly", label: "Monthly", durationMonths: 1 },
    { slug: "quarterly", label: "Quarterly", durationMonths: 3 },
    { slug: "semi-annually", label: "Semi-Annually", durationMonths: 6 },
    { slug: "yearly", label: "Yearly", durationMonths: 12 },
  ];
  for (const bp of billPeriods) {
    await prisma.billingPeriod.upsert({
      where: { slug: bp.slug },
      update: {},
      create: bp,
    });
  }

  // 4. EAV Attributes (With Icons)
  const attributes = [
    { slug: "bedroom", label: "Bedroom", dataType: "NUMBER", iconUrl: "bed-outline" },
    { slug: "bathroom", label: "Bathroom", dataType: "NUMBER", iconUrl: "water-outline" },
    { slug: "area", label: "Building Area (sqm)", dataType: "NUMBER", iconUrl: "expand-outline" },
    { slug: "floor", label: "Number of Floors", dataType: "NUMBER", iconUrl: "layers-outline" },
    { slug: "furnishing", label: "Furnishing", dataType: "STRING", iconUrl: "sofa-outline" },
    { slug: "garage", label: "Garage Capacity", dataType: "NUMBER", iconUrl: "car-outline" },
    { slug: "electricity", label: "Electricity (VA)", dataType: "NUMBER", iconUrl: "flash-outline" },
    { slug: "wifi_speed", label: "WiFi Speed (Mbps)", dataType: "NUMBER", iconUrl: "wifi-outline" },
  ];
  for (const attr of attributes) {
    await prisma.propertyAttributeType.upsert({
      where: { slug: attr.slug },
      update: { iconUrl: attr.iconUrl },
      create: attr,
    });
  }
}

async function seedPermissions() {
  console.log("🔐 [Seed] RBAC Permissions...");
  const permissions = [
    // Property
    { action: "property.create", description: "Create new properties" },
    { action: "property.update", description: "Update existing properties" },
    { action: "property.delete", description: "Delete properties" },
    // Trust & Governance
    { action: "trust.score.update", description: "Update trust scores manually" },
    { action: "user.verify", description: "Verify user KYC" },
    { action: "dispute.resolve", description: "Resolve disputes" }, // NEW
    // Finance
    { action: "finance.payout.approve", description: "Approve withdrawal requests" },
    { action: "system.config", description: "Manage system configurations" },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: {},
      create: p,
    });
  }
}

async function seedRolesAndUsers() {
  console.log("👥 [Seed] Users & Roles...");
  
  // 1. Create Roles
  const roles = ["TENANT", "LANDLORD", "ADMIN"];
  const roleMap: Record<string, string> = {}; // Name -> ID

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, description: `System ${r} Role` },
    });
    roleMap[r] = role.id;
  }

  // 2. Assign Permissions to Admin
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 3. Create Users
  const password = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // --- ADMIN USER ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@rentverse.com" },
    update: { password: adminPassword, isVerified: true },
    create: { 
      email: "admin@rentverse.com", 
      password: adminPassword, 
      name: "Super Admin", 
      isVerified: true,
      avatarUrl: "rentverse-public/avatars/admin.png"
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleMap["ADMIN"] } },
    update: {},
    create: { userId: admin.id, roleId: roleMap["ADMIN"] },
  });

  // --- TENANT USER ---
  const tenant = await prisma.user.upsert({
    where: { email: "tenant@rentverse.com" },
    update: { password, isVerified: true },
    create: { 
      email: "tenant@rentverse.com", 
      password, 
      name: "John Tenant", 
      phone: "081234567890", 
      isVerified: true,
      avatarUrl: "rentverse-public/avatars/tenant.png"
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: tenant.id, roleId: roleMap["TENANT"] } },
    update: {},
    create: { userId: tenant.id, roleId: roleMap["TENANT"] },
  });
  // Tenant Trust Profile
  await prisma.tenantTrustProfile.upsert({
    where: { userRefId: tenant.id },
    update: { kyc_status: "VERIFIED", tti_score: 85.0 },
    create: { 
      userRefId: tenant.id, 
      kyc_status: "VERIFIED", 
      tti_score: 85.0, 
      ktpUrl: "rentverse-private/kyc/tenant-ktp.jpg" 
    },
  });
  // Tenant Wallet
  await prisma.wallet.upsert({
    where: { userId: tenant.id },
    update: { balance: 5000000 },
    create: { userId: tenant.id, balance: 5000000, currency: "IDR" }
  });

  // --- LANDLORD USER ---
  const landlord = await prisma.user.upsert({
    where: { email: "landlord@rentverse.com" },
    update: { password, isVerified: true },
    create: { 
      email: "landlord@rentverse.com", 
      password, 
      name: "Jane Landlord", 
      phone: "081987654321", 
      isVerified: true,
      avatarUrl: "rentverse-public/avatars/landlord.png"
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: landlord.id, roleId: roleMap["LANDLORD"] } },
    update: {},
    create: { userId: landlord.id, roleId: roleMap["LANDLORD"] },
  });
  // Landlord Trust Profile
  await prisma.landlordTrustProfile.upsert({
    where: { userRefId: landlord.id },
    update: { kyc_status: "VERIFIED", lrs_score: 92.0 },
    create: { 
      userRefId: landlord.id, 
      kyc_status: "VERIFIED", 
      lrs_score: 92.0, 
      ktpUrl: "rentverse-private/kyc/landlord-ktp.jpg" 
    },
  });
  // Landlord Wallet
  await prisma.wallet.upsert({
    where: { userId: landlord.id },
    update: { balance: 15000000 },
    create: { userId: landlord.id, balance: 15000000, currency: "IDR" }
  });
}

async function seedProperties() {
  console.log("🏠 [Seed] Properties...");
  const landlord = await prisma.user.findUniqueOrThrow({ where: { email: "landlord@rentverse.com" } });
  
  // Fetch Reference IDs
  const villaType = await prisma.propertyType.findUniqueOrThrow({ where: { slug: "villa" } });
  const roomType = await prisma.propertyType.findUniqueOrThrow({ where: { slug: "room" } });
  const rentType = await prisma.listingType.findUniqueOrThrow({ where: { slug: "rent" } });
  
  const monthly = await prisma.billingPeriod.findUniqueOrThrow({ where: { slug: "monthly" } });
  const yearly = await prisma.billingPeriod.findUniqueOrThrow({ where: { slug: "yearly" } });
  
  const attrBed = await prisma.propertyAttributeType.findUniqueOrThrow({ where: { slug: "bedroom" } });
  const attrWifi = await prisma.propertyAttributeType.findUniqueOrThrow({ where: { slug: "wifi_speed" } });

  // 1. Luxury Villa (Verified)
  await prisma.property.create({
    data: {
      landlordId: landlord.id,
      title: "Sunset Paradise Villa",
      description: "Experience luxury living in this 3-bedroom villa with a private infinity pool.",
      address: "Jl. Sunset Road No. 88, Seminyak",
      city: "Bali",
      country: "Indonesia",
      latitude: -8.6913,
      longitude: 115.1682,
      price: 25000000, 
      currency: "IDR", 
      isVerified: true,
      propertyTypeId: villaType.id,
      listingTypeId: rentType.id,
      amenities: ["POOL", "WIFI", "AC", "GARDEN", "PARKING"],
      allowedBillingPeriods: { create: [{ billingPeriodId: monthly.id }, { billingPeriodId: yearly.id }] },
      attributes: { 
        create: [
          { attributeTypeId: attrBed.id, value: "3" }, 
          { attributeTypeId: attrWifi.id, value: "100" }
        ] 
      },
      images: { 
        create: [
          { url: "rentverse-public/seeds/villa-1.jpg", isPrimary: true }, 
          { url: "rentverse-public/seeds/villa-2.jpg", isPrimary: false }
        ] 
      }
    }
  });

  // 2. Cozy Kost (Unverified)
  await prisma.property.create({
    data: {
      landlordId: landlord.id,
      title: "Cozy Student Room near UI",
      description: "Affordable room for students, walking distance to campus.",
      address: "Jl. Margonda Raya No. 12",
      city: "Depok",
      country: "Indonesia",
      latitude: -6.3725,
      longitude: 106.8294,
      price: 1500000, 
      currency: "IDR", 
      isVerified: false, 
      propertyTypeId: roomType.id,
      listingTypeId: rentType.id,
      amenities: ["WIFI", "AC"],
      allowedBillingPeriods: { create: [{ billingPeriodId: monthly.id }] },
      attributes: { 
        create: [
          { attributeTypeId: attrBed.id, value: "1" },
          { attributeTypeId: attrWifi.id, value: "20" }
        ] 
      },
      images: { 
        create: [{ url: "rentverse-public/seeds/kost-1.jpg", isPrimary: true }] 
      }
    }
  });
}

async function seedTrustEvents() {
  console.log("⚖️ [Seed] Trust Rules...");
  const events = [
    { code: "PAYMENT_LATE", category: "PAYMENT", role: "TENANT", baseImpact: -5.0, description: "Paid rent after due date" },
    { code: "PAYMENT_ON_TIME", category: "PAYMENT", role: "TENANT", baseImpact: 2.0, description: "Paid rent on time" },
    { code: "COMM_FAST_RESPONSE", category: "COMMUNICATION", role: "LANDLORD", baseImpact: 3.0, description: "Responded within 30 mins" },
    { code: "FAKE_LISTING", category: "ACCURACY", role: "LANDLORD", baseImpact: -50.0, description: "Posted a fake listing" },
    { code: "KYC_VERIFIED", category: "COMPLIANCE", role: "TENANT", baseImpact: 10.0, description: "Identity verified by Admin" },
    { code: "DISPUTE_LOST", category: "BEHAVIOR", role: "TENANT", baseImpact: -15.0, description: "Found at fault in dispute" },
  ];
  for (const e of events) {
    await prisma.trustEvent.upsert({ where: { code: e.code }, update: { description: e.description }, create: e });
  }
}

async function seedBookingsAndDisputes() {
  console.log("📅 [Seed] Bookings & Disputes...");
  
  const tenant = await prisma.user.findUniqueOrThrow({ where: { email: "tenant@rentverse.com" } });
  const landlord = await prisma.user.findUniqueOrThrow({ where: { email: "landlord@rentverse.com" } });
  
  // Find the Villa we created earlier
  const villa = await prisma.property.findFirstOrThrow({ where: { title: "Sunset Paradise Villa" } });
  const monthly = await prisma.billingPeriod.findUniqueOrThrow({ where: { slug: "monthly" } });

  // 1. Create a Booking (Active)
  const booking = await prisma.booking.create({
    data: {
      tenantId: tenant.id,
      propertyId: villa.id,
      billingPeriodId: monthly.id,
      startDate: new Date(),
      nextPaymentDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: "CONFIRMED",
      invoices: {
        create: {
          amount: 25000000,
          status: "PAID",
          dueDate: new Date(),
          paidAt: new Date(),
          midtransOrderId: `ORDER-${Date.now()}`
        }
      }
    }
  });

  // 2. Create a Dispute for this Booking
  await prisma.dispute.create({
    data: {
      bookingId: booking.id,
      initiatorId: tenant.id,
      reason: "AC Not Working",
      description: "The air conditioner in the master bedroom has been broken for 3 days and the landlord is not responding.",
      status: "OPEN"
    }
  });
}

async function seedChat() {
  console.log("💬 [Seed] Chat Rooms...");
  
  const tenant = await prisma.user.findUniqueOrThrow({ where: { email: "tenant@rentverse.com" } });
  const landlord = await prisma.user.findUniqueOrThrow({ where: { email: "landlord@rentverse.com" } });
  const villa = await prisma.property.findFirstOrThrow({ where: { title: "Sunset Paradise Villa" } });

  // Create Room
  const room = await prisma.chatRoom.create({
    data: {
      propertyId: villa.id,
      tenantId: tenant.id,
      landlordId: landlord.id,
      lastMessageAt: new Date(),
      messages: {
        create: [
          { senderId: tenant.id, content: "Hi, is this villa still available?" },
          { senderId: landlord.id, content: "Yes, it is available for next month." }
        ]
      }
    }
  });
}

async function main() {
  try {
    await seedReferences();
    await seedPermissions();
    await seedRolesAndUsers();
    await seedTrustEvents();
    await seedProperties();
    await seedBookingsAndDisputes();
    await seedChat();
    
    console.log("✅ [Seed] Database seeding completed successfully.");
  } catch (e) {
    console.error("❌ [Seed] Failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();