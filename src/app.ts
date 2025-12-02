import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

import { env } from './config/env.js';
import errorHandler from './middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';

const app: Application = express();

/**
 * =====================================================================
 * 1. GLOBAL MIDDLEWARES
 * =====================================================================
 */

// Security Headers (XSS protection, etc.)
app.use(helmet());

// Cross-Origin Resource Sharing
// In production, you should configure the 'origin' option to allow only your frontend domain.
app.use(cors());

// Body Parser (JSON)
// Limits payload size to prevent DOS attacks via large payloads.
app.use(express.json({ limit: '10kb' }));

/**
 * =====================================================================
 * 2. API DOCUMENTATION (Swagger/OpenAPI)
 * =====================================================================
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rentverse API',
      version: '1.0.0',
      description: 'Smart Rental Trust Dashboard & Marketplace API',
      contact: {
        name: 'Rentverse DevOps Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
  apis: ['./src/modules/**/*.routes.ts'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * =====================================================================
 * 3. ROUTE MOUNTING
 * =====================================================================
 */

// Health Check Endpoint (Used by Docker Healthcheck)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Rentverse Backend (Node 24 + TS) is Online',
    timestamp: new Date().toISOString(),
    documentation: '/api-docs',
  });
});

// Mount Business Modules
app.use('/api/v1/auth', authRoutes);

// Handle 404 - Not Found for undefined routes
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

/**
 * =====================================================================
 * 4. GLOBAL ERROR HANDLER
 * =====================================================================
 * MUST be defined last, after all routes and other middlewares.
 */
app.use(errorHandler);

export default app;