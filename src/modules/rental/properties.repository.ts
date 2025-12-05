import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { CreatePropertyInput } from "./properties.schema.js";

class PropertiesRepository {
  /**
   * Create Property with Relations (Transaction)
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

        // [NEW] Mapped Fields
        amenities: data.amenities,
        latitude: data.latitude,
        longitude: data.longitude,

        propertyTypeId: data.propertyTypeId,
        listingTypeId: data.listingTypeId,
        price: data.price,
        currency: data.currency,
        address: data.address,
        city: data.city,
        country: data.country,

        // ... existing relations (billing, attributes, images)
        allowedBillingPeriods: {
          create: data.billingPeriodIds.map((bpId) => ({
            billingPeriodId: bpId,
          })),
        },
        attributes: {
          create: data.attributes.map((attr) => ({
            attributeTypeId: attr.attributeTypeId,
            value: attr.value,
          })),
        },
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            isPrimary: index === 0,
          })),
        },
      },
      include: {
        images: true,
        attributes: { include: { attributeType: true } },
      },
    });
  }

  /**
   * [Refactored] Find All using Cursor Pagination
   * optimized for Infinite Scroll on Mobile.
   */
  async findAll(
    where: Prisma.PropertyWhereInput,
    limit: number,
    cursor?: string, // The ID of the last item user saw
    orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: "desc" }
  ) {
    // If cursor is provided, we skip the cursor itself (cursor + 1)
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    const [total, properties] = await prisma.$transaction([
      // Count is still useful for "Showing 10 of 500 results"
      prisma.property.count({ where }),

      prisma.property.findMany({
        where,
        take: limit,
        skip,
        cursor: cursorObj,
        orderBy,
        include: {
          images: {
            where: { isPrimary: true },
            select: { url: true },
          },
          propertyType: true,
          listingType: true,
          attributes: {
            include: { attributeType: true },
          },
          // [Mobile Optimization] Include condensed landlord info
          // landlord: { select: { name: true, avatarUrl: true } }
        },
      }),
    ]);

    return { total, properties };
  }

  /**
   * [NEW] Find One by ID (Detailed View)
   */
  async findById(id: string) {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        images: true, // All images
        propertyType: true,
        listingType: true,
        allowedBillingPeriods: { include: { billingPeriod: true } },
        attributes: { include: { attributeType: true } },
        // Include Landlord Info (Public Profile)
        // Note: In a real app, you'd join the 'LandlordProfile' to get the trust score
      },
    });
  }
}

export default new PropertiesRepository();
