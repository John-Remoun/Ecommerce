import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface UploadFileOptions {
  buffer: Buffer;
  mimetype: string;
  folder?: string;
  filename?: string;
}

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly expiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('S3_REGION', 'us-east-1');
    this.bucket = this.configService.get<string>('S3_BUCKET_NAME', '');
    this.expiresIn = this.configService.get<number>('S3_EXPIRES_IN', 120);

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>(
          'S3_ACCESS_SECRET_KEY',
          '',
        ),
      },
    });
  }

  async uploadFile({
    buffer,
    mimetype,
    folder = 'uploads',
    filename,
  }: UploadFileOptions): Promise<{ key: string; url: string }> {
    const key = `${folder}/${filename ?? `${randomUUID()}-${Date.now()}`}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    return {
      key,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: expiresIn ?? this.expiresIn,
    });
  }
}
