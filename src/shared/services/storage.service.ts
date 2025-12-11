import { minioClient } from "../../config/storage.js";
import { env } from "../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import logger from "../../config/logger.js";

class StorageService {
  private publicBucket = env.MINIO_BUCKET;
  private privateBucket = "rentverse-private";

  constructor() {
    this.initBuckets();
  }

  // ... (Keep initBuckets / ensureBucket / uploadFile / uploadPrivate as is) ...
  private async initBuckets() {
    await this.ensureBucket(this.publicBucket, true);
    await this.ensureBucket(this.privateBucket, false);
  }

  private async ensureBucket(bucketName: string, isPublic: boolean) {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, env.MINIO_REGION);
        if (isPublic) {
          const policy = {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          };
          await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        }
        logger.info(
          `[Storage] Bucket '${bucketName}' ready (Public: ${isPublic})`
        );
      }
    } catch (error) {
      logger.error(`[Storage] Failed to init bucket ${bucketName}:`, error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = "public"
  ): Promise<string> {
    const filename = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    await minioClient.putObject(
      this.publicBucket,
      filename,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype }
    );
    return `${this.publicBucket}/${filename}`;
  }

  async uploadPrivate(
    file: Express.Multer.File,
    folder = "kyc"
  ): Promise<string> {
    const filename = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    await minioClient.putObject(
      this.privateBucket,
      filename,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype }
    );
    return `${this.privateBucket}/${filename}`;
  }

  /**
   * Generate Public URL
   * Central logic to switch between Public Domain (Prod) and Localhost (Dev).
   */
  getPublicUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // If it's already a full URL (e.g. Google avatar), return as is
    if (path.startsWith("http")) return path;

    // 1. Determine Host: Prioritize STORAGE_PUBLIC_HOST
    // Remove trailing slash if present to avoid double slashes
    const host = (env.STORAGE_PUBLIC_HOST || env.MINIO_URL).replace(/\/$/, "");

    // 2. Clean Path: Remove leading slash
    const cleanPath = path.replace(/^\//, "");

    return `${host}/${cleanPath}`;
  }

  /**
   * Generate Signed URL for viewing private files
   */
  async getPresignedUrl(filePath: string): Promise<string> {
    const [bucket, ...rest] = filePath.split("/");
    const objectName = rest.join("/");
    // Note: Signed URLs usually default to the internal endpoint.
    // If you need public signed URLs, you might need to override the client endpoint here.
    return await minioClient.presignedGetObject(bucket, objectName, 3600);
  }
}

export default new StorageService();
