// NOTE: We import from the CUSTOM GENERATED PATH defined in schema.prisma
import { PrismaClient } from "../../src/shared/prisma-client";
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

async function seedRolesAndAdmin() {
  console.log("🛡️ Seeding Roles & Admin...");

  // 1. Roles
  const roles = ["TENANT", "LANDLORD", "ADMIN"];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
  }

  // 2. Super Admin
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "admin@rentverse.com" },
      update: {},
      create: {
        email: "admin@rentverse.com",
        password: hashedPassword,
        name: "Super Admin",
        isVerified: true,
        roles: { create: [{ roleId: adminRole.id }] },
      },
    });
  }
}

async function seedTrustEvents() {
  console.log("⚖️ Seeding Trust Scoring Rules...");

  const events = [
    {
      code: "PAYMENT_LATE",
      category: "PAYMENT",
      role: "TENANT",
      baseImpact: -5.0,
    },
    {
      code: "PAYMENT_ON_TIME",
      category: "PAYMENT",
      role: "TENANT",
      baseImpact: 2.0,
    },
    {
      code: "COMM_FAST_RESPONSE",
      category: "COMMUNICATION",
      role: "LANDLORD",
      baseImpact: 3.0,
    },
    {
      code: "FAKE_LISTING",
      category: "ACCURACY",
      role: "LANDLORD",
      baseImpact: -50.0,
    },
  ];

  for (const e of events) {
    await prisma.trustEvent.upsert({
      where: { code: e.code },
      update: {},
      create: e,
    });
  }
}

async function main() {
  await seedReferences();
  await seedRolesAndAdmin();
  await seedTrustEvents();
  console.log("✅ Seeding Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
