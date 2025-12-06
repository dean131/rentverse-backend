import { Prisma } from "@prisma/client";
import propertiesRepository from "./properties.repository.js";
import storageService from "../../shared/services/storage.service.js";
import { CreatePropertyInput } from "./properties.schema.js";
import { env } from "../../config/env.js";

class PropertiesService {
  /**
   * Helper: Transforms DB Image Paths (Relative) to Public URLs (Absolute).
   * This makes the database portable (doesn't store hardcoded domains).
   */
  private transformProperty(property: any) {
    if (!property) return null;
    return {
      ...property,
      images: property.images.map((img: any) => ({
        ...img,
        // DB stores: "rentverse-public/properties/abc.jpg"
        // API returns: "http://localhost:9000/rentverse-public/properties/abc.jpg"
        url: img.url.startsWith('http') ? img.url : `${env.MINIO_URL}/${img.url}`,
      })),
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
    // 1. Upload Images to MinIO (Parallel Upload)
    const uploadPromises = files.map((file) =>
      storageService.uploadFile(file, `properties/${landlordId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    // 2. Save to Database
    const property = await propertiesRepository.create(
      landlordId,
      input,
      imageUrls
    );

    // 3. Return transformed data
    return this.transformProperty(property);
  }

  /**
   * Get Property Feed (Search & Filter).
   */
  async getAllProperties(query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;

    // Build Filters
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      isVerified: true, // Only show verified listings
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

    // Build Sort
    let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sortBy === "price_asc") orderBy = { price: "asc" };
    if (query.sortBy === "price_desc") orderBy = { price: "desc" };
    if (query.sortBy === "oldest") orderBy = { createdAt: "asc" };

    // Fetch Data
    const { total, properties } = await propertiesRepository.findAll(
      where,
      limit,
      cursor,
      orderBy
    );

    // Determine Next Cursor
    let nextCursor: string | null = null;
    if (properties.length === limit) {
      nextCursor = properties[properties.length - 1].id;
    }

    // Transform URLs
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
}

export default new PropertiesService();