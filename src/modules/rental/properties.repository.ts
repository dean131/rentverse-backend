import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { CreatePropertyInput, UpdatePropertyInput } from "./properties.schema.js";

class PropertiesRepository {
  /**
   * Create Property with all relations in a single transaction.
   */
  async create(
    landlordId: string,
    data: CreatePropertyInput,
    imageUrls: string[]
  ) {
    return await prisma.property.create({
      data: {
        landlordId,
        title: data.title,
        description: data.description,

        // Location & Specs
        address: data.address,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        amenities: data.amenities,

        // Master Data Links
        propertyTypeId: data.propertyTypeId,
        listingTypeId: data.listingTypeId,
        price: data.price,
        currency: data.currency,
        isVerified: false, // Default to false until Admin approves

        // 1. Link Billing Periods
        allowedBillingPeriods: {
          create: data.billingPeriodIds.map((bpId) => ({
            billingPeriodId: bpId,
          })),
        },

        // 2. Insert Dynamic Attributes (EAV)
        attributes: {
          create: data.attributes.map((attr) => ({
            attributeTypeId: attr.attributeTypeId,
            value: attr.value,
          })),
        },

        // 3. Insert Images
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            isPrimary: index === 0, // First image is primary
          })),
        },
      },
      // Return the created object with relations for immediate display
      include: {
        images: true,
        attributes: { include: { attributeType: true } },
        propertyType: true,
        listingType: true,
      },
    });
  }

  /**
   * Find All Properties with Cursor-Based Pagination (Infinite Scroll).
   */
  async findAll(
    where: Prisma.PropertyWhereInput,
    limit: number,
    cursor?: string,
    orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: "desc" }
  ) {
    // If cursor exists, skip the cursor itself (skip: 1)
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    const [total, properties] = await prisma.$transaction([
      // 1. Get Total Count (for metadata)
      prisma.property.count({ where }),

      // 2. Get Data Page
      prisma.property.findMany({
        where,
        take: limit,
        skip,
        cursor: cursorObj,
        orderBy,
        include: {
          images: {
            where: { isPrimary: true }, // List view only needs the thumbnail
            select: { url: true, isPrimary: true },
          },
          propertyType: { select: { label: true } },
          listingType: { select: { label: true } },
          attributes: {
            include: { attributeType: true },
            take: 3, // Optimize: Only fetch top 3 specs for the card view
          },
        },
      }),
    ]);

    return { total, properties };
  }

  /**
   * Find Detailed Property by ID.
   */
  async findById(id: string) {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        propertyType: true,
        listingType: true,
        allowedBillingPeriods: { include: { billingPeriod: true } },
        attributes: { include: { attributeType: true } },
        landlord: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
            isVerified: true,
            landlordProfile: {
              select: { lrs_score: true, response_rate: true },
            },
          },
        },
      },
    });
  }

  /**
   * [NEW] Update Property
   * Handles complex relation updates (Attributes, BillingPeriods).
   */
  async update(id: string, data: UpdatePropertyInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Prepare Update Object
      const updateData: Prisma.PropertyUpdateInput = {
        title: data.title,
        description: data.description,
        price: data.price,
        address: data.address,
        city: data.city,
        amenities: data.amenities, // Replaces the whole array
        updatedAt: new Date(),
      };

      // 2. Handle Billing Periods (Replace Strategy)
      if (data.billingPeriodIds) {
        updateData.allowedBillingPeriods = {
          deleteMany: {}, // Clear old
          create: data.billingPeriodIds.map((bpId) => ({
            billingPeriodId: bpId,
          })),
        };
      }

      // 3. Handle EAV Attributes (Replace Strategy)
      if (data.attributes) {
        updateData.attributes = {
          deleteMany: {}, // Clear old specs
          create: data.attributes.map((attr) => ({
            attributeTypeId: attr.attributeTypeId,
            value: attr.value,
          })),
        };
      }

      // 4. Execute Update
      return await tx.property.update({
        where: { id },
        data: updateData,
        include: {
          attributes: { include: { attributeType: true } },
          allowedBillingPeriods: true,
          images: true,
        },
      });
    });
  }

  /**
   * Soft Delete (Archive)
   */
  async softDelete(id: string) {
    return await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default new PropertiesRepository();
