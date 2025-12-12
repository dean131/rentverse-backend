import eventBus from "../../shared/bus/event-bus.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerPropertySubscribers = () => {
  
  // Listen for Reviews to update Property Score
  eventBus.subscribe("REVIEW:CREATED", async (payload: any) => {
    // Only process Tenant reviews (which target Properties)
    if (payload.role !== "TENANT") return;

    try {
      // 1. Find the Property ID via the Booking
      const booking = await prisma.booking.findUnique({
        where: { id: payload.bookingId },
        select: { propertyId: true }
      });

      if (!booking) return;

      const propertyId = booking.propertyId;
      const newRating = payload.rating;

      // 2. Recalculate Average (Transactional for consistency)
      await prisma.$transaction(async (tx) => {
        const property = await tx.property.findUniqueOrThrow({
          where: { id: propertyId },
          select: { averageRating: true, reviewCount: true }
        });

        // Running Average Formula: NewAvg = ((OldAvg * Count) + NewVal) / (Count + 1)
        const totalScore = (property.averageRating * property.reviewCount) + newRating;
        const newCount = property.reviewCount + 1;
        const newAverage = Number((totalScore / newCount).toFixed(2)); // Keep 2 decimals

        // 3. Update Property
        await tx.property.update({
          where: { id: propertyId },
          data: {
            averageRating: newAverage,
            reviewCount: newCount
          }
        });

        logger.info(`[Property] Updated rating for ${propertyId}: ${newAverage} (${newCount} reviews)`);
      });

    } catch (error) {
      logger.error(`[Property] Failed to update rating:`, error);
    }
  });
};