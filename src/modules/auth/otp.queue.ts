import { Queue, Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";
import emailService from "../../shared/services/email.service.js";
import whatsappService from "../../shared/services/whatsapp.service.js";

// Define Payload Interface
interface OtpJobData {
  target: string;
  channel: "EMAIL" | "WHATSAPP";
  otp: string;
}

// 1. Define the Queue (Producer)
export const otpQueue = new Queue("OtpQueue", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3, // Retry if SMTP/WAHA is down
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

// 2. Define the Worker (Consumer)
const otpWorker = new Worker<OtpJobData>(
  "OtpQueue",
  async (job: Job<OtpJobData>) => {
    const { target, channel, otp } = job.data;

    try {
      if (channel === "EMAIL") {
        await emailService.sendOtp(target, otp);
        logger.info(`[OtpQueue] Email sent to ${target}`);
      } else {
        await whatsappService.sendOtp(target, otp);
        logger.info(`[OtpQueue] WhatsApp sent to ${target}`);
      }
    } catch (error: any) {
      logger.error(`[OtpQueue] Failed to send OTP to ${target} via ${channel}:`, error);
      throw error; // Triggers retry
    }
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    concurrency: 10, // Emails/Http requests are IO bound, so we can run parallel
  }
);

otpWorker.on("failed", (job, err) => {
  logger.error(`[OtpQueue] Job ${job?.id} failed permanently: ${err.message}`);
});

logger.info("[OtpQueue] Worker initialized");