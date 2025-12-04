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
}

export default new PropertiesRepository();
