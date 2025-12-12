import { env } from "./config/env.js";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./config/redis.js";

import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import rentalRoutes from "./modules/rental/rental.routes.js";
import propertiesRoutes from "./modules/rental/properties.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import kycRoutes from "./modules/kyc/kyc.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import financeRoutes from "./modules/finance/finance.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import landlordRoutes from "./modules/landlord/landlord.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import disputeRoutes from "./modules/dispute/dispute.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";

const app: Application = express();

/**
 * =====================================================================
 * GLOBAL MIDDLEWARES
 * =====================================================================
 */
app.use(helmet());
// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));

/**
 * =====================================================================
 * RATE LIMITER (REDIS BACKED)
 * =====================================================================
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, 
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with type mismatch between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use("/api", limiter);

/**
 * =====================================================================
 * ROUTE MOUNTING
 * =====================================================================
 */

// Health Check Endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Rentverse Backend (Node 24 + TS) is Online",
    timestamp: new Date().toISOString(),
  });
});

// Mount Business Modules
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rental", rentalRoutes);
app.use("/api/v1/properties", propertiesRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/kyc", kycRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/landlord", landlordRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", disputeRoutes);
app.use("/api/v1/reviews", reviewRoutes);

// Handle 404 - Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

/**
 * =====================================================================
 * GLOBAL ERROR HANDLER
 * =====================================================================
 */
app.use(errorHandler);

export default app;
