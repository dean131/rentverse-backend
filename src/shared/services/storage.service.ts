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

  /**
   * Upload Public File (Property Photos, Avatars)
   */
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
      {
        "Content-Type": file.mimetype,
      }
    );
    // Return relative path: "rentverse-public/prop/123.jpg"
    return `${this.publicBucket}/${filename}`;
  }

  /**
   * Upload Private File (ID Cards, Contracts)
   * Not accessible via public URL.
   */
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
      {
        "Content-Type": file.mimetype,
      }
    );
    // Return relative path: "rentverse-private/kyc/123.jpg"
    return `${this.privateBucket}/${filename}`;
  }

  /**
   * Generate Signed URL for viewing private files
   * Valid for 1 Hour (3600 seconds)
   */
  async getPresignedUrl(filePath: string): Promise<string> {
    const [bucket, ...rest] = filePath.split("/");
    const objectName = rest.join("/");
    return await minioClient.presignedGetObject(bucket, objectName, 3600);
  }
}

export default new StorageService();
