import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AuditLog } from './model/audit-log.model';

export interface CreateAuditLogInput {
  actor?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async create(input: CreateAuditLogInput) {
    return this.auditLogModel.create(input);
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(),
    ]);

    return {
      docs,
      currentPage: page,
      pages: Math.ceil(total / limit) || 1,
      size: docs.length,
      total,
    };
  }
}
