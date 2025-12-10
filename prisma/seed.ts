import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedReferences() {
  console.log("[Seed] Seeding Reference Data..."); // [UPDATED]

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

  // 4. EAV Attributes
  const attributes = [
    { slug: "bedroom", label: "Bedroom", dataType: "NUMBER" },
    { slug: "bathroom", label: "Bathroom", dataType: "NUMBER" },
    { slug: "area", label: "Building Area", dataType: "NUMBER" },
    { slug: "floor", label: "Number of Floors", dataType: "NUMBER" },
    { slug: "furnishing", label: "Furnishing", dataType: "STRING" },
    { slug: "garage", label: "Garage Capacity", dataType: "NUMBER" },
    { slug: "electricity", label: "Electricity (VA)", dataType: "NUMBER" },
  ];
  for (const attr of attributes) {
    await prisma.propertyAttributeType.upsert({
      where: { slug: attr.slug },
      update: {},
      create: attr,
    });
  }
}

async function seedPermissions() {
  console.log("[Seed] Seeding Permissions..."); // [UPDATED]
  const permissions = [
    {
      action: "trust.score.update",
      description: "Update trust scores manually",
    },
    { action: "property.create", description: "Create new properties" },
    { action: "property.update", description: "Update existing properties" },
    { action: "property.delete", description: "Delete properties" },
    { action: "user.verify", description: "Verify user KYC" },
    { action: "system.config", description: "Manage system configurations" },
    {
      action: "finance.payout.approve",
      description: "Approve withdrawal requests",
    },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: {},
      create: p,
    });
  }
}

async function seedRolesAndAdmin() {
  console.log("[Seed] Seeding Roles & Admin..."); // [UPDATED]
  const roles = ["TENANT", "LANDLORD", "ADMIN"];
  const roleRecords: Record<string, any> = {};

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
    roleRecords[r] = role;
  }

  const allPermissions = await prisma.permission.findMany();
  const adminRole = roleRecords["ADMIN"];

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rentverse.com" },
    update: { password: hashedPassword, isVerified: true },
    create: {
      email: "admin@rentverse.com",
      password: hashedPassword,
      name: "Super Admin",
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
}

async function seedDemoUsers() {
  console.log("[Seed] Seeding Demo Users..."); // [UPDATED]
  const commonPassword = await bcrypt.hash("password123", 10);
  const tenantRole = await prisma.role.findUniqueOrThrow({
    where: { name: "TENANT" },
  });
  const landlordRole = await prisma.role.findUniqueOrThrow({
    where: { name: "LANDLORD" },
  });

  // 1. Tenant
  const tenant = await prisma.user.upsert({
    where: { email: "tenant@rentverse.com" },
    update: { password: commonPassword, isVerified: true },
    create: {
      email: "tenant@rentverse.com",
      password: commonPassword,
      name: "Demo Tenant",
      phone: "081200000001",
      isVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: tenant.id, roleId: tenantRole.id } },
    update: {},
    create: { userId: tenant.id, roleId: tenantRole.id },
  });
  await prisma.tenantTrustProfile.upsert({
    where: { userRefId: tenant.id },
    update: { kyc_status: "VERIFIED", tti_score: 85.0 },
    create: {
      userRefId: tenant.id,
      kyc_status: "VERIFIED",
      tti_score: 85.0,
      ktpUrl: "rentverse-private/kyc/demo-tenant-ktp.jpg",
    },
  });
  await prisma.wallet.upsert({
    where: { userId: tenant.id },
    update: {},
    create: { userId: tenant.id, balance: 0, currency: "IDR" },
  });

  // 2. Landlord
  const landlord = await prisma.user.upsert({
    where: { email: "landlord@rentverse.com" },
    update: { password: commonPassword, isVerified: true },
    create: {
      email: "landlord@rentverse.com",
      password: commonPassword,
      name: "Demo Landlord",
      phone: "081200000002",
      isVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: landlord.id, roleId: landlordRole.id } },
    update: {},
    create: { userId: landlord.id, roleId: landlordRole.id },
  });
  await prisma.landlordTrustProfile.upsert({
    where: { userRefId: landlord.id },
    update: { kyc_status: "VERIFIED", lrs_score: 90.0 },
    create: {
      userRefId: landlord.id,
      kyc_status: "VERIFIED",
      lrs_score: 90.0,
      ktpUrl: "rentverse-private/kyc/demo-landlord-ktp.jpg",
    },
  });
  await prisma.wallet.upsert({
    where: { userId: landlord.id },
    update: {},
    create: { userId: landlord.id, balance: 0, currency: "IDR" },
  });
}

async function seedDemoProperties() {
  console.log("[Seed] Seeding Demo Properties..."); // [UPDATED]
  const landlord = await prisma.user.findUniqueOrThrow({
    where: { email: "landlord@rentverse.com" },
  });

  const villaType = await prisma.propertyType.findUniqueOrThrow({
    where: { slug: "villa" },
  });
  const roomType = await prisma.propertyType.findUniqueOrThrow({
    where: { slug: "room" },
  });
  const rentType = await prisma.listingType.findUniqueOrThrow({
    where: { slug: "rent" },
  });
  const monthly = await prisma.billingPeriod.findUniqueOrThrow({
    where: { slug: "monthly" },
  });
  const yearly = await prisma.billingPeriod.findUniqueOrThrow({
    where: { slug: "yearly" },
  });
  const bedroomAttr = await prisma.propertyAttributeType.findUniqueOrThrow({
    where: { slug: "bedroom" },
  });
  const wifiAttr = await prisma.propertyAttributeType.findUniqueOrThrow({
    where: { slug: "electricity" },
  });

  // 1. Verified Property
  await prisma.property.create({
    data: {
      landlordId: landlord.id,
      title: "Sunny Villa in Bali (Verified)",
      description: "A beautiful 3-bedroom villa with a private pool.",
      address: "Jalan Sunset Road No. 88",
      city: "Bali",
      country: "Indonesia",
      latitude: -8.409518,
      longitude: 115.188919,
      price: 25000000,
      currency: "IDR",
      isVerified: true,
      propertyTypeId: villaType.id,
      listingTypeId: rentType.id,
      amenities: ["POOL", "WIFI", "AC", "GARDEN"],
      allowedBillingPeriods: {
        create: [
          { billingPeriodId: monthly.id },
          { billingPeriodId: yearly.id },
        ],
      },
      attributes: {
        create: [
          { attributeTypeId: bedroomAttr.id, value: "3" },
          { attributeTypeId: wifiAttr.id, value: "5500" },
        ],
      },
      images: {
        create: [
          { url: "rentverse-public/seeds/villa-1.jpg", isPrimary: true },
          { url: "rentverse-public/seeds/villa-2.jpg", isPrimary: false },
        ],
      },
    },
  });

  // 2. Unverified Property
  await prisma.property.create({
    data: {
      landlordId: landlord.id,
      title: "Cozy Studio in Jakarta (Unverified)",
      description: "Simple room in South Jakarta.",
      address: "Jalan Fatmawati Raya No. 10",
      city: "Jakarta Selatan",
      country: "Indonesia",
      latitude: -6.292434,
      longitude: 106.799677,
      price: 2500000,
      currency: "IDR",
      isVerified: false,
      propertyTypeId: roomType.id,
      listingTypeId: rentType.id,
      amenities: ["WIFI", "AC"],
      allowedBillingPeriods: { create: [{ billingPeriodId: monthly.id }] },
      attributes: { create: [{ attributeTypeId: bedroomAttr.id, value: "1" }] },
      images: {
        create: [{ url: "rentverse-public/seeds/kost-1.jpg", isPrimary: true }],
      },
    },
  });
}

async function seedTrustEvents() {
  console.log("[Seed] Seeding Trust Scoring Rules..."); // [UPDATED]
  const events = [
    {
      code: "PAYMENT_LATE",
      category: "PAYMENT",
      role: "TENANT",
      baseImpact: -5.0,
      description: "Tenant paid rent after the due date",
    },
    {
      code: "PAYMENT_ON_TIME",
      category: "PAYMENT",
      role: "TENANT",
      baseImpact: 2.0,
      description: "Tenant paid rent on or before the due date",
    },
    {
      code: "COMM_FAST_RESPONSE",
      category: "COMMUNICATION",
      role: "LANDLORD",
      baseImpact: 3.0,
      description: "Landlord responds to inquiries within 30 minutes",
    },
    {
      code: "FAKE_LISTING",
      category: "ACCURACY",
      role: "LANDLORD",
      baseImpact: -50.0,
      description: "Landlord posted a verified fake listing",
    },
    //  KYC Reward
    {
      code: "KYC_VERIFIED",
      category: "COMPLIANCE",
      role: "TENANT",
      baseImpact: 10.0,
      description: "Identity verified by Admin",
    },
  ];
  for (const e of events) {
    await prisma.trustEvent.upsert({
      where: { code: e.code },
      update: { description: e.description },
      create: e,
    });
  }
}

async function main() {
  try {
    await seedReferences();
    await seedPermissions();
    await seedRolesAndAdmin();
    await seedDemoUsers();
    await seedDemoProperties();
    await seedTrustEvents();
    console.log("[Seed] Completed Successfully."); // [UPDATED]
  } catch (e) {
    console.error("[Seed] Failed:", e); // [UPDATED]
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
