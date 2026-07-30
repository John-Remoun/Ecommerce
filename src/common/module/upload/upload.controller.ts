import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { S3Service } from './s3.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Controller({ path: 'upload', version: '1' })
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only image files (jpeg, png, webp, gif) are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    const result = await this.s3Service.uploadFile({
      buffer: file.buffer,
      mimetype: file.mimetype,
      filename: file.originalname,
    });

    return {
      message: 'File uploaded successfully',
      data: result,
    };
  }
}
