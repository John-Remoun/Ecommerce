import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditInterceptor } from 'src/common/interceptor/audit.interceptor';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { AuditLog, AuditLogSchema } from './model/audit-log.model';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    AuthenticationModule,
  ],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
