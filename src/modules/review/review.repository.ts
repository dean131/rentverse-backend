import prisma from "../../config/prisma.js";
import { CreateReviewInput } from "./review.schema.js";

class ReviewRepository {
  /**
   * Check if review already exists
   */
  async findExistingReview(bookingId: string, reviewerId: string) {
    return await prisma.review.findUnique({
      where: {
        bookingId_reviewerId: { bookingId, reviewerId },
      },
    });
  }

  /**
   * Create Review
   */
  async create(reviewerId: string, role: string, data: CreateReviewInput) {
    return await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        reviewerId,
        role,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        booking: {
          include: {
            property: { select: { landlordId: true } }, // To find receiver (if Tenant reviews)
            tenant: { select: { id: true } } // To find receiver (if Landlord reviews)
          }
        }
      }
    });
  }

  /**
   * Get Reviews for a Property (Public Feed)
   */
  async findByProperty(propertyId: string, limit: number, cursor?: string) {
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    return await prisma.review.findMany({
      where: {
        booking: { propertyId },
        role: "TENANT", // Only show reviews written BY tenants
      },
      take: limit,
      skip,
      cursor: cursorObj,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { name: true, avatarUrl: true } }
      }
    });
  }
}

export default new ReviewRepository();