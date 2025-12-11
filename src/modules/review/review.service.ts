import reviewRepository from "./review.repository.js";
import bookingRepository from "../booking/booking.repository.js"; // Reuse existing repo
import { CreateReviewInput } from "./review.schema.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";
import storageService from "../../shared/services/storage.service.js"; // For avatar URLs

class ReviewService {
  async submitReview(reviewerId: string, reviewerRole: string, input: CreateReviewInput) {
    // 1. Check Booking Existence
    // We can use a simpler findUnique here, or reuse bookingRepo
    const existingReview = await reviewRepository.findExistingReview(input.bookingId, reviewerId);
    if (existingReview) {
      throw new AppError("You have already reviewed this booking", 409);
    }

    // 2. Create Review
    const review = await reviewRepository.create(reviewerId, reviewerRole, input);

    // 3. Determine Receiver (The person being rated)
    let receiverId = "";
    if (reviewerRole === "TENANT") {
      receiverId = review.booking.property.landlordId; // Tenant rates Landlord/Property
    } else {
      receiverId = review.booking.tenant.id; // Landlord rates Tenant
    }

    // 4. Publish Event (Trust Engine will pick this up)
    eventBus.publish("REVIEW:CREATED", {
      reviewId: review.id,
      bookingId: review.bookingId,
      reviewerId: reviewerId,
      receiverId: receiverId,
      role: reviewerRole as "TENANT" | "LANDLORD",
      rating: input.rating,
    });

    return { message: "Review submitted successfully" };
  }

  async getPropertyReviews(propertyId: string, query: any) {
    const limit = Number(query.limit) || 5;
    const cursor = query.cursor as string | undefined;

    const reviews = await reviewRepository.findByProperty(propertyId, limit, cursor);
    
    // Transform Avatar URLs
    const data = reviews.map(r => ({
      ...r,
      reviewer: {
        ...r.reviewer,
        avatarUrl: storageService.getPublicUrl(r.reviewer.avatarUrl)
      }
    }));

    // Pagination Meta
    let nextCursor: string | null = null;
    if (reviews.length === limit) {
      nextCursor = reviews[reviews.length - 1].id;
    }

    return { data, meta: { limit, nextCursor, hasMore: !!nextCursor } };
  }
}

export default new ReviewService();