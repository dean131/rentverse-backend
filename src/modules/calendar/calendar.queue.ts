import { Queue, Worker } from "bullmq";
import nodeIcal from "node-ical";
import { env } from "../../config/env.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

// 1. The Queue (Producer)
export const calendarQueue = new Queue("CalendarSyncQueue", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
  },
});

// 2. The Worker (Consumer)
const calendarWorker = new Worker(
  "CalendarSyncQueue",
  async (job) => {
    logger.info("[Calendar] Starting Batch Sync...");

    // A. Find properties with an Import URL
    const properties = await prisma.property.findMany({
      where: { icalImportUrl: { not: null } },
      select: { id: true, icalImportUrl: true, landlordId: true },
    });

    logger.info(`[Calendar] Found ${properties.length} properties to sync.`);

    for (const property of properties) {
      if (!property.icalImportUrl) continue;

      try {
        // B. Parse External iCal
        // Use 'await' directly if your version of node-ical supports promises,
        // otherwise use 'promisify' or the '.async' helper if available.
        const events = await nodeIcal.async.fromURL(property.icalImportUrl);

        for (const key in events) {
          const event = events[key];

          // We only care about VEVENT type with valid dates
          if (event.type === "VEVENT" && event.start && event.end) {
            // C. Upsert Booking (Block Dates)
            await prisma.booking.upsert({
              where: {
                externalId: event.uid, // The UID from Airbnb/Booking.com
              },
              update: {
                startDate: event.start,
                endDate: event.end,
              },
              create: {
                propertyId: property.id,
                tenantId: property.landlordId,
                startDate: event.start,
                endDate: event.end,
                status: "BLOCKED",
                source: "EXTERNAL_ICAL",
                externalId: event.uid,

                // OPTIONAL FIELDS
                // billingPeriodId: undefined,
                // nextPaymentDate: undefined,
              },
            });
          }
        }
        logger.debug(`[Calendar] Synced property ${property.id}`);
      } catch (error) {
        logger.error(
          `[Calendar] Failed to sync property ${property.id}:`,
          error
        );
      }
    }
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
  }
);

// 3. Scheduler
export const startCalendarScheduler = async () => {
  // Add a job that repeats every 30 minutes
  await calendarQueue.add(
    "syncAll",
    {},
    {
      repeat: {
        every: 30 * 60 * 1000,
      },
    }
  );
  logger.info("[Calendar] Scheduler started (Every 30m)");
};
