import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import { env } from "./config/env.js";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app: Application = express();

/**
 * =====================================================================
 * 1. GLOBAL MIDDLEWARES
 * =====================================================================
 */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

/**
 * =====================================================================
 * 2. API DOCUMENTATION (Swagger/OpenAPI)
 * =====================================================================
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rentverse API",
      version: "1.0.0",
      description: "Smart Rental Trust Dashboard & Marketplace API",
      contact: {
        name: "Rentverse DevOps Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Auto-discovery of documentation in route files
  apis: ["./src/modules/**/*.routes.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * =====================================================================
 * 3. ROUTE MOUNTING
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

// [FIX] Handle 404 - Not Found
// Ganti app.all('*') dengan app.use() agar kompatibel dengan Express 5
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

/**
 * =====================================================================
 * 4. GLOBAL ERROR HANDLER
 * =====================================================================
 */
app.use(errorHandler);

export default app;
