import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    console.log('S3Service constructor called');
    this.region = process.env.AWS_REGION || 'us-east-2';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  isConfigured(): boolean {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    return !!(bucketName && 
              process.env.AWS_ACCESS_KEY_ID && 
              process.env.AWS_SECRET_ACCESS_KEY);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not configured. Please set AWS credentials and bucket name.');
    }

    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured. Please check your environment variables.');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `pets/${uuidv4()}${fileExtension}`;
    
    const fileContent = file.buffer;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype
    };

    try {
      console.log('Attempting to upload to S3 bucket:', this.bucketName);
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      console.error('Upload params:', { ...uploadParams, Body: '[File Buffer]' });
      throw new Error('Failed to upload file to S3');
    }
  }

  async deleteFile(imageUrl: string): Promise<void> {
    if (!this.isConfigured() || !imageUrl.includes(this.bucketName)) {
      return;
    }

    try {
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1);

      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      console.error('Error deleting from S3:', error);
    }
  }

  async getPresignedUploadUrl(fileName: string, contentType: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not configured');
    }

    const key = `pets/${uuidv4()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
