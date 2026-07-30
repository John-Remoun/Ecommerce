import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Coupon } from './coupon.model';
import { Product } from './product.model';
import { User } from './user.model';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  priceAtAdd!: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'Ecommerce_CARTS',
})
export class Cart {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user!: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];

  @Prop({ type: Types.ObjectId, ref: Coupon.name })
  appliedCoupon?: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  tax!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  total!: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: CartSchema },
]);
