import { Prisma } from "@prisma/client";
import propertiesRepository from "./properties.repository.js";
import storageService from "../../shared/services/storage.service.js";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "./properties.schema.js";
import { env } from "../../config/env.js";
import AppError from "../../shared/utils/AppError.js";

class PropertiesService {
  /**
   * Helper: Transforms DB Paths to Public URLs
   * Handles both Property Images AND Landlord Avatar
   */
  private transformProperty(property: any) {
    if (!property) return null;

    // 1. Transform Property Images
    const images = property.images.map((img: any) => ({
      ...img,
      url: storageService.getPublicUrl(img.url),
    }));

    // 2. Transform Landlord Avatar (if present)
    let landlord = property.landlord;
    if (landlord && landlord.avatarUrl) {
      landlord = {
        ...landlord,
        avatarUrl: storageService.getPublicUrl(landlord.avatarUrl),
      };
    }

    return {
      ...property,
      images,
      landlord, // Returns the original landlord object with updated avatarUrl

      // Expose the Rating (Defaults to 0 if null/undefined)
      // This maps the DB field 'averageRating' to the API field 'rating'
      rating: property.averageRating || 0,
      reviewCount: property.reviewCount || 0,
    };
  }

  /**
   * Create a new Property Listing.
   */
  async createProperty(
    landlordId: string,
    input: CreatePropertyInput,
    files: Express.Multer.File[]
  ) {
    const uploadPromises = files.map((file) =>
      storageService.uploadFile(file, `properties/${landlordId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    const property = await propertiesRepository.create(
      landlordId,
      input,
      imageUrls
    );

    return this.transformProperty(property);
  }

  /**
   * Get Property Feed.
   */
  async getAllProperties(query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      isVerified: true,
    };

    if (query.search) {
      where.title = { contains: query.search as string, mode: "insensitive" };
    }
    if (query.city) {
      where.city = { contains: query.city as string, mode: "insensitive" };
    }
    if (query.typeId) {
      where.propertyTypeId = Number(query.typeId);
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = Number(query.minPrice);
      if (query.maxPrice) where.price.lte = Number(query.maxPrice);
    }

    let orderBy: Prisma.PropertyOrderByWithRelationInput = {
      createdAt: "desc",
    };
    if (query.sortBy === "price_asc") orderBy = { price: "asc" };
    if (query.sortBy === "price_desc") orderBy = { price: "desc" };
    if (query.sortBy === "oldest") orderBy = { createdAt: "asc" };

    const { total, properties } = await propertiesRepository.findAll(
      where,
      limit,
      cursor,
      orderBy
    );

    let nextCursor: string | null = null;
    if (properties.length === limit) {
      nextCursor = properties[properties.length - 1].id;
    }

    const data = properties.map((p) => this.transformProperty(p));

    return {
      data,
      meta: {
        total,
        limit,
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }

  /**
   * Get Single Property Detail.
   */
  async getPropertyById(id: string) {
    const property = await propertiesRepository.findById(id);
    return this.transformProperty(property);
  }

  /**
   * Update Property
   */
  async updateProperty(
    landlordId: string,
    propertyId: string,
    input: UpdatePropertyInput
  ) {
    // 1. Verify Ownership
    const property = await propertiesRepository.findById(propertyId);

    if (!property) throw new AppError("Property not found", 404);
    if (property.landlordId !== landlordId) {
      throw new AppError(
        "You do not have permission to edit this property",
        403
      );
    }

    // 2. Perform Update
    const updated = await propertiesRepository.update(propertyId, input);
    return this.transformProperty(updated);
  }

  /**
   * Delete Property
   */
  async deleteProperty(landlordId: string, propertyId: string) {
    // 1. Verify Ownership
    const property = await propertiesRepository.findById(propertyId);

    if (!property) throw new AppError("Property not found", 404);
    if (property.landlordId !== landlordId) {
      throw new AppError(
        "You do not have permission to delete this property",
        403
      );
    }

    // 2. Soft Delete
    await propertiesRepository.softDelete(propertyId);
    return true;
  }
}

export default new PropertiesService();
