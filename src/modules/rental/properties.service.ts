import { Prisma } from "@prisma/client";
import propertiesRepository from "./properties.repository.js";
import storageService from "../../shared/services/storage.service.js";
import { CreatePropertyInput } from "./properties.schema.js";

class PropertiesService {
  async createProperty(
    landlordId: string,
    input: CreatePropertyInput,
    files: Express.Multer.File[]
  ) {
    // 1. Upload Images to MinIO
    const uploadPromises = files.map((file) =>
      storageService.uploadFile(file, `properties/${landlordId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    // 2. Create Database Record
    const property = await propertiesRepository.create(
      landlordId,
      input,
      imageUrls
    );

    return property;
  }

  /**
   * [Refactored] Get All Properties (Infinite Scroll)
   */
  async getAllProperties(query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;

    // 1. Build Filter Object (Same as before)
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

    // Filter by Type
    if (query.typeId) {
      where.propertyTypeId = Number(query.typeId);
    }

    // Filter by Price Range
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = Number(query.minPrice);
      if (query.maxPrice) where.price.lte = Number(query.maxPrice);
    }

    // 2. Build Sort
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {
      createdAt: "desc",
    };
    if (query.sortBy === "price_asc") orderBy = { price: "asc" };
    if (query.sortBy === "price_desc") orderBy = { price: "desc" };
    if (query.sortBy === "oldest") orderBy = { createdAt: "asc" };

    // 3. Execute Query
    const { total, properties } = await propertiesRepository.findAll(
      where,
      limit,
      cursor,
      orderBy
    );

    // 4. Calculate Next Cursor
    // If we got fewer items than limit, we reached the end.
    let nextCursor: string | null = null;
    if (properties.length === limit) {
      // The cursor for the next page is the ID of the last item we just fetched
      nextCursor = properties[properties.length - 1].id;
    }

    return {
      data: properties,
      meta: {
        total,
        limit,
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }

  /**
   * Get Property Detail
   */
  async getPropertyById(id: string) {
    const property = await propertiesRepository.findById(id);

    if (!property) return null; // Controller will handle 404

    return property;
  }
}

export default new PropertiesService();
