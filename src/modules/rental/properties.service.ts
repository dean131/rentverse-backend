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
   * [NEW] Get All Properties (Search Logic)
   */
  async getAllProperties(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // 1. Build Filter Object
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null, // Only active listings
      isVerified: true, // Only verified listings (Optional: depends on business logic)
    };

    // Search by Title (Case Insensitive)
    if (query.search) {
      where.title = { contains: query.search as string, mode: "insensitive" };
    }

    // Filter by City
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

    // 2. Build Sort Object
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {
      createdAt: "desc",
    }; // Default: Newest

    if (query.sortBy === "price_asc") orderBy = { price: "asc" };
    if (query.sortBy === "price_desc") orderBy = { price: "desc" };
    if (query.sortBy === "oldest") orderBy = { createdAt: "asc" };

    // 3. Execute Query
    const { total, properties } = await propertiesRepository.findAll(
      where,
      page,
      limit,
      orderBy
    );

    return { total, properties, page, limit };
  }

  /**
   * [NEW] Get Property Detail
   */
  async getPropertyById(id: string) {
    const property = await propertiesRepository.findById(id);

    if (!property) return null; // Controller will handle 404

    return property;
  }
}

export default new PropertiesService();
