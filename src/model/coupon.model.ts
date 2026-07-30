import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CouponTypeEnum } from 'src/common/enum/coupon.enum';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'Ecommerce_COUPONS',
})
export class Coupon {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId;
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({
    type: String,
    enum: Object.values(CouponTypeEnum),
    required: true,
  })
  type!: CouponTypeEnum;

  @Prop({ type: Number, required: true, min: 0 })
  value!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  minOrderValue!: number;

  @Prop({ type: Number, required: true, min: 1 })
  maxUses!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  usedCount!: number;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

export const CouponModel = MongooseModule.forFeature([
  { name: Coupon.name, schema: CouponSchema },
]);
