import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string(),

  // Cache (Redis)
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),

  // Object Storage (MinIO)
  MINIO_ENDPOINT: z.string(), // "minio_storage"
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_USE_SSL: z
    .string()
    .transform((val) => val === "true")
    .default(false),

  // Public URL for Mobile App
  MINIO_URL: z.string().url(),

  // Bucket Details
  MINIO_BUCKET: z.string().default("rentverse-public"),
  MINIO_REGION: z.string().default("us-east-1"),

  // Security
  JWT_SECRET: z.string().min(32),

  // EMAIL (Mailpit/SMTP)
  SMTP_HOST: z.string().default("rentverse_mailpit"), // Default to container name
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default("none"),
  SMTP_PASS: z.string().default("none"),
  SMTP_SECURE: z.coerce.boolean().default(false),

  // Payment (Midtrans)
  MIDTRANS_SERVER_KEY: z.string(),
  MIDTRANS_CLIENT_KEY: z.string(),

  // Notifications (Firebase)
  FIREBASE_CREDENTIALS_PATH: z.string().optional(),

  WA_API_URL: z.string().default("http://waha:3000"),
  WA_API_KEY: z.string().default("rentverse_secret_key"),
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
