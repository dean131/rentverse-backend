import { minioClient } from "../../config/storage.js";
import { env } from "../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

class StorageService {
  private bucketName = "rentverse-public";

  constructor() {
    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    const exists = await minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await minioClient.makeBucket(this.bucketName, "us-east-1"); // Region is required but ignored by MinIO

      // Set Policy to Public Read
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
      await minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy)
      );
    }
  }

  /**
   * Upload a file buffer to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = "properties"
  ): Promise<string> {
    const extension = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${extension}`;

    await minioClient.putObject(
      this.bucketName,
      filename,
      file.buffer,
      file.size,
      {
        "Content-Type": file.mimetype,
      }
    );

    // Return the accessible public URL
    // NOTE: In production, this would be your CDN or Nginx proxy URL
    return `${env.STORAGE_PUBLIC_HOST}/${this.bucketName}/${filename}`;
  }
}

export default new StorageService();
