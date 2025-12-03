// type: uploaded file
// fileName: rentverse-backend/prisma/seeds/seed.ts

// NOTE: We import from the CUSTOM GENERATED PATH defined in schema.prisma
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedReferences() {
  console.log("🌱 Seeding Reference Data (EAV & Enums Replacement)...");

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

  // 4. EAV Attributes (Dynamic Specs)
  const attributes = [
    { slug: "bedroom", label: "Bedroom", dataType: "NUMBER", iconUrl: "bed" },
    {
      slug: "bathroom",
      label: "Bathroom",
      dataType: "NUMBER",
      iconUrl: "bath",
    },
    {
      slug: "area",
      label: "Building Area",
      dataType: "NUMBER",
      iconUrl: "ruler",
    },
    {
      slug: "floor",
      label: "Number of Floors",
      dataType: "NUMBER",
      iconUrl: "layers",
    },
    {
      slug: "furnishing",
      label: "Furnishing",
      dataType: "STRING",
      iconUrl: "sofa",
    },
    {
      slug: "garage",
      label: "Garage Capacity",
      dataType: "NUMBER",
      iconUrl: "car",
    },
    {
      slug: "electricity",
      label: "Electricity (VA)",
      dataType: "NUMBER",
      iconUrl: "zap",
    },
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
  console.log("🔐 Seeding Permissions...");

  const permissions = [
    { action: "trust.score.update", description: "Update trust scores manually" },
    { action: "property.create", description: "Create new properties" },
    { action: "property.update", description: "Update existing properties" },
    { action: "property.delete", description: "Delete properties" },
    { action: "user.verify", description: "Verify user KYC" },
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

async function seedRolesAndAdmin() {
  console.log("🛡️ Seeding Roles & Admin...");

  // 1. Roles
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

  // 2. Map Permissions to ADMIN Role
  const allPermissions = await prisma.permission.findMany();
  const adminRole = roleRecords["ADMIN"];

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 3. Super Admin User
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rentverse.com" },
    update: {
      password: hashedPassword, // Ensure password is updated if changed
      isVerified: true,
    },
    create: {
      email: "admin@rentverse.com",
      password: hashedPassword,
      name: "Super Admin",
      isVerified: true,
    },
  });

  // Ensure Admin has the ADMIN role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log("   > Admin user ready: admin@rentverse.com / admin123");
}

async function seedTrustEvents() {
  console.log("⚖️ Seeding Trust Scoring Rules...");

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
  ];

  for (const e of events) {
    await prisma.trustEvent.upsert({
      where: { code: e.code },
      update: {
        description: e.description // Allow updating description
      },
      create: e,
    });
  }
}

async function main() {
  try {
    await seedReferences();
    await seedPermissions(); // New function
    await seedRolesAndAdmin();
    await seedTrustEvents();
    
    console.log("✅ Seeding Completed Successfully.");
  } catch (e) {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();