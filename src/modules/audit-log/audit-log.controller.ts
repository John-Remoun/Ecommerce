import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RoleEnum } from 'src/common/enum/user.enums';
import { AuditLogService } from './audit-log.service';

@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.auditLogService.findAll(query);
    return { message: 'Audit logs retrieved', data: result };
  }
}
