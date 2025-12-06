import { minioClient } from "../../config/storage.js";
import { env } from "../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import logger from "../../config/logger.js";

class StorageService {
  private bucketName = env.MINIO_BUCKET;

  constructor() {
    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await minioClient.makeBucket(this.bucketName, env.MINIO_REGION);
        
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        logger.info(`[Storage] Bucket '${this.bucketName}' created with public policy.`);
      }
    } catch (error) {
      logger.error("[Storage] Failed to initialize bucket:", error);
    }
  }

  async uploadFile(file: Express.Multer.File, folder = "properties"): Promise<string> {
    const extension = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${extension}`;

    await minioClient.putObject(
      this.bucketName,
      filename,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype }
    );

    // Return Relative Path ONLY
    return `${this.bucketName}/${filename}`;
  }
}

export default new StorageService();