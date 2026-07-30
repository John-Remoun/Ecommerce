import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MAIL_QUEUE, MailProcessor } from './mail.processor';
import { UPLOAD_QUEUE, UploadProcessor } from './upload.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URI', 'redis://localhost:6379'),
        },
      }),
    }),
    BullModule.registerQueue({ name: MAIL_QUEUE }, { name: UPLOAD_QUEUE }),
  ],
  providers: [MailProcessor, UploadProcessor],
  exports: [BullModule],
})
export class QueueModule {}
