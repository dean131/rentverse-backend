import { Prisma } from "@prisma/client";
import propertiesRepository from "./properties.repository.js";
import storageService from "../../shared/services/storage.service.js";
import { CreatePropertyInput } from "./properties.schema.js";
import { env } from "../../config/env.js";

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
      url: img.url.startsWith("http") ? img.url : `${env.MINIO_URL}/${img.url}`,
    }));

    // 2. Transform Landlord Avatar (if present)
    let landlord = property.landlord;
    if (landlord && landlord.avatarUrl) {
      landlord = {
        ...landlord,
        avatarUrl: landlord.avatarUrl.startsWith("http")
          ? landlord.avatarUrl
          : `${env.MINIO_URL}/${landlord.avatarUrl}`,
      };
    }

    return {
      ...property,
      images,
      landlord, // Returns the original landlord object with updated avatarUrl
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
}

export default new PropertiesService();
