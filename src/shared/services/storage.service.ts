import { minioClient } from "../../config/storage.js";
import { env } from "../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import logger from "../../config/logger.js";

class StorageService {
  private publicBucket = env.MINIO_BUCKET; // "rentverse-public"
  private privateBucket = "rentverse-private"; // Locked bucket

  constructor() {
    this.ensureBucketExists(this.publicBucket, true);
    this.ensureBucketExists(this.privateBucket, false); // Private
  }

  private async ensureBucketExists(bucketName: string, isPublic: boolean) {
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
          `[Storage] Bucket '${bucketName}' created (Public: ${isPublic})`
        );
      }
    } catch (error) {
      logger.error(`[Storage] Failed to init bucket ${bucketName}:`, error);
    }
  }

  /**
   * Upload Public File (Photos)
   */
  async uploadPublic(
    file: Express.Multer.File,
    folder = "properties"
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
    return `${this.publicBucket}/${filename}`; // Relative path
  }

  /**
   * Upload Private File (ID Cards)
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
    return `${this.privateBucket}/${filename}`;
  }

  /**
   * Generate a Temporary Access Link (Signed URL)
   * Valid for 1 hour only.
   */
  async getPresignedUrl(filePath: string): Promise<string> {
    const [bucket, ...rest] = filePath.split("/");
    const objectName = rest.join("/");

    // Generates a URL like: http://minio.../bucket/file?signature=xyz...
    return await minioClient.presignedGetObject(bucket, objectName, 60 * 60);
  }
}

export default new StorageService();
