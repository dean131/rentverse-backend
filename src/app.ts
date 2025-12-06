import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from 'express-rate-limit';

import { env } from "./config/env.js";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import rentalRoutes from './modules/rental/rental.routes.js';
import propertiesRoutes from './modules/rental/properties.routes.js';
import notificationRoutes from "./modules/notification/notification.routes.js";
import kycRoutes from "./modules/kyc/kyc.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";

const app: Application = express();

/**
 * =====================================================================
 * GLOBAL MIDDLEWARES
 * =====================================================================
 */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

/**
 * =====================================================================
 * RATE LIMITER
 * =====================================================================
 */
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
    message: {
        status: "fail",
        message: "Too many requests from this IP, please try again after 15 minutes"
    }
});
app.use('/api', limiter);

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
    documentation: "/api-docs",
  });
});

// Mount Business Modules
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rental", rentalRoutes);
app.use("/api/v1/properties", propertiesRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/kyc", kycRoutes);
app.use("/api/v1/bookings", bookingRoutes);

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
