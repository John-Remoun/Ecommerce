import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  NotificationAudienceEnum,
  NotificationTypeEnum,
} from 'src/common/enum/notification.enum';
import { Notification } from './model/notification.model';

export interface CreateNotificationInput {
  recipient?: string;
  type: NotificationTypeEnum;
  message: string;
  audience?: NotificationAudienceEnum;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async create(input: CreateNotificationInput) {
    return this.notificationModel.create({
      recipient: input.recipient
        ? new Types.ObjectId(input.recipient)
        : undefined,
      type: input.type,
      message: input.message,
      audience: input.audience ?? NotificationAudienceEnum.USER,
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipient: new Types.ObjectId(userId),
      },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async listByUser(userId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { recipient: new Types.ObjectId(userId) },
        { audience: NotificationAudienceEnum.ALL },
      ],
    };

    const [docs, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
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
