import eventBus from "../../shared/bus/event-bus.js";
import walletService from "./wallet.service.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerFinanceSubscribers = () => {
  
  // Event: PAYMENT:PAID
  // Source: src/modules/payment/payment.service.ts
  eventBus.subscribe("PAYMENT:PAID", async (payload) => {
    logger.info(`[Finance] Listener received payment event for Invoice ${payload.invoiceId}`);

    try {
      // 1. Find the Landlord associated with this booking
      const booking = await prisma.booking.findUnique({
        where: { id: payload.bookingId },
        select: { 
          property: { 
            select: { landlordId: true } 
          } 
        }
      });

      if (!booking) {
        logger.error(`[Finance] Booking ${payload.bookingId} not found. Cannot process wallet split.`);
        return;
      }

      // 2. Process the Money Split
      await walletService.processRentSplit(
        payload.invoiceId,
        payload.amount,
        booking.property.landlordId
      );

    } catch (error) {
      logger.error(`[Finance] Critical Error processing wallet split:`, error);
    }
  });
};