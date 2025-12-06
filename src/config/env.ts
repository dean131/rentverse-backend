import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string(),

  // Cache (Redis)
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),

  // Object Storage (MinIO)
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  STORAGE_PUBLIC_HOST: z.string().url(),

  // Security
  JWT_SECRET: z.string().min(32),

  // Payment (Midtrans)
  MIDTRANS_SERVER_KEY: z.string(),
  MIDTRANS_CLIENT_KEY: z.string(),

  // Notifications (Firebase)
  // Optional: If missing, the app runs in "Mock Notification" mode
  FIREBASE_CREDENTIALS_PATH: z.string().optional(),
});

// Parse and Validate
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "[ERROR]Invalid environment variables:",
    JSON.stringify(_env.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = _env.data;