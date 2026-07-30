import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  NotificationAudienceEnum,
  NotificationTypeEnum,
} from 'src/common/enum/notification.enum';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'Ecommerce_APP_NOTIFICATIONS',
})
export class Notification {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  recipient?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationTypeEnum),
    required: true,
  })
  type!: NotificationTypeEnum;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: Boolean, default: false })
  isRead!: boolean;

  @Prop({
    type: String,
    enum: Object.values(NotificationAudienceEnum),
    default: NotificationAudienceEnum.USER,
  })
  audience!: NotificationAudienceEnum;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
