import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  timestamps: true,
  collection: 'Ecommerce_APP_AUDIT_LOGS',
})
export class AuditLog {
  @Prop({ type: String, index: true })
  actor?: string;

  @Prop({ type: String, required: true, index: true })
  action!: string;

  @Prop({ type: String, required: true, index: true })
  resource!: string;

  @Prop({ type: String, index: true })
  resourceId?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  changes?: Record<string, unknown>;

  @Prop({ type: String })
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
