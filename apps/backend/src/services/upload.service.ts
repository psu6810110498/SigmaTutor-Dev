import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export class UploadService {
  private s3Client: S3Client;
  private bucketName = process.env.R2_BUCKET_NAME ?? 'sigma-files';

  constructor() {
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT ?? '',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads') {
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      // คืนค่า URL กลับไป (เดี๋ยวต้องไปเปิด Public URL ใน Cloudflare ต่อ)
      return {
        url: `https://pub-d0f41a703ea14e2092f9c58b4d489324.r2.dev/${fileName}`,
        key: fileName
      };
    } catch (error) {
      console.error('R2 Upload Error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }
}
