import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY } from '../decorator/audit.decorator';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: { _id?: string; email?: string };
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      ip?: string;
      headers?: Record<string, string>;
    }>();

    const resourceId =
      request.params?.id ??
      (request.body?.id as string | undefined) ??
      (request.body?._id as string | undefined);

    return next.handle().pipe(
      tap((response) => {
        void this.auditLogService.create({
          actor: request.user?._id?.toString() ?? request.user?.email,
          action,
          resource: context.getClass().name.replace('Controller', ''),
          resourceId,
          changes: {
            requestBody: request.body,
            response,
          },
          ipAddress:
            request.ip ??
            request.headers?.['x-forwarded-for'] ??
            request.headers?.['x-real-ip'],
        });
      }),
    );
  }
}
