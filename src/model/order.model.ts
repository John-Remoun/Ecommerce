import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatusEnum, PaymentStatusEnum } from 'src/common/enum/order.enum';
import { Coupon } from './coupon.model';
import { Product } from './product.model';
import { User } from './user.model';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ type: String, required: true })
  street!: string;

  @Prop({ type: String, required: true })
  city!: string;

  @Prop({ type: String, required: true })
  state!: string;

  @Prop({ type: String, required: true })
  zipCode!: string;

  @Prop({ type: String, required: true })
  country!: string;
}

const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  priceAtPurchase!: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'Ecommerce_APP_ORDERS',
})
export class Order {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress!: ShippingAddress;

  @Prop({ type: Types.ObjectId, ref: Coupon.name })
  coupon?: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  tax!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  shippingCost!: number;

  @Prop({ type: Number, required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatusEnum),
    default: OrderStatusEnum.PENDING,
  })
  status!: OrderStatusEnum;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatusEnum),
    default: PaymentStatusEnum.PENDING,
  })
  paymentStatus!: PaymentStatusEnum;

  @Prop({ type: String })
  stripePaymentIntentId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
