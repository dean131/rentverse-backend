import { Prisma } from "@prisma/client";
import propertiesRepository from "./properties.repository.js";
import storageService from "../../shared/services/storage.service.js";
import { CreatePropertyInput } from "./properties.schema.js";
import { env } from "../../config/env.js";

class PropertiesService {
  /**
   * Helper: Prepends the Host URL to image paths
   */
  private transformProperty(property: any) {
    if (!property) return null;
    return {
      ...property,
      images: property.images.map((img: any) => ({
        ...img,
        // Dynamically attach the host
        // DB: "rentverse-public/prop/1.jpg"
        // API: "http://localhost:9000/rentverse-public/prop/1.jpg"
        url: `${env.MINIO_URL}/${img.url}`,
      })),
    };
  }

  async createProperty(
    landlordId: string,
    input: CreatePropertyInput,
    files: Express.Multer.File[]
  ) {
    const uploadPromises = files.map((file) =>
      storageService.uploadPublic(file, `properties/${landlordId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    const property = await propertiesRepository.create(
      landlordId,
      input,
      imageUrls
    );

    return this.transformProperty(property);
  }

  async getAllProperties(query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      isVerified: true,
    };

    if (query.search)
      where.title = { contains: query.search as string, mode: "insensitive" };
    if (query.city)
      where.city = { contains: query.city as string, mode: "insensitive" };
    if (query.typeId) where.propertyTypeId = Number(query.typeId);

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

    // Calculate Cursor
    let nextCursor: string | null = null;
    if (properties.length === limit) {
      nextCursor = properties[properties.length - 1].id;
    }

    // Transform URLs before returning
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

  async getPropertyById(id: string) {
    const property = await propertiesRepository.findById(id);
    // Transform URL
    return this.transformProperty(property);
  }
}

export default new PropertiesService();
