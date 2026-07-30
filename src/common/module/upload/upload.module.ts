import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { S3Module } from './s3.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [S3Module, AuthenticationModule],
  controllers: [UploadController],
})
export class UploadModule {}
