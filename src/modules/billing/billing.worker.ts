import cron from "node-cron";
import bookingService from "../booking/booking.service.js";
import logger from "../../config/logger.js";

export const startBillingScheduler = () => {
  // Run every day at 00:01 AM
  // cron.schedule("1 0 * * *", async () => {
  cron.schedule("* * * * *", async () => {
    logger.info("[Cron] Running Daily Billing Job...");
    try {
      const stats = await bookingService.generateRecurringInvoices();
      logger.info(`[Cron] Billing Job Completed. Success: ${stats.success}, Failed: ${stats.failed}`);
    } catch (error) {
      logger.error("[Cron] Billing Job Crashed:", error);
    }
  });
  
  logger.info("[Cron] Billing Scheduler started (00:01 Daily)");
};