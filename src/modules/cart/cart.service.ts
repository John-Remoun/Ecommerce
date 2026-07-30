import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CouponTypeEnum } from 'src/common/enum/coupon.enum';
import { IUser } from 'src/common/interface/user.interface';
import { Cart, CartItem } from 'src/model/cart.model';
import { Coupon } from 'src/model/coupon.model';
import { Product } from 'src/model/product.model';
import { CouponService } from '../coupon/coupon.service';
import { ProductRepository } from '../product/product.repository';
import { CartRepository } from './cart.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

const TAX_RATE = 0.1;

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponService: CouponService,
  ) {}

  private getUserId(user: IUser): string {
    const userId = user._id;
    if (!userId) {
      throw new BadRequestException('Invalid user context');
    }
    return String(userId);
  }

  private getEffectivePrice(product: Product): number {
    if (product.discountPrice != null && product.discountPrice >= 0) {
      return product.discountPrice;
    }
    return product.price;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  calculateTotals(
    items: CartItem[],
    coupon?: Coupon | null,
  ): Pick<Cart, 'subtotal' | 'discount' | 'tax' | 'total'> {
    const subtotal = this.round(
      items.reduce((sum, item) => sum + item.quantity * item.priceAtAdd, 0),
    );

    let discount = 0;
    if (coupon) {
      if (coupon.type === CouponTypeEnum.PERCENTAGE) {
        discount = this.round(subtotal * (coupon.value / 100));
      } else {
        discount = this.round(Math.min(coupon.value, subtotal));
      }
    }

    const taxable = Math.max(subtotal - discount, 0);
    const tax = this.round(taxable * TAX_RATE);
    const total = this.round(taxable + tax);

    return { subtotal, discount, tax, total };
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      cart = await this.cartRepository.createOne({
        data: {
          user: new Types.ObjectId(userId),
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
        },
      });
    }

    return cart;
  }

  async getCart(user: IUser) {
    const userId = this.getUserId(user);
    await this.getOrCreateCart(userId);
    return {
      message: 'Cart retrieved',
      data: await this.cartRepository.findByUserId(userId),
    };
  }

  async addItem(user: IUser, dto: AddCartItemDto) {
    const userId = this.getUserId(user);
    const product = await this.productRepository.findById({
      id: dto.productId,
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const cart = await this.getOrCreateCart(userId);
    const priceAtAdd = this.getEffectivePrice(product);
    const productObjectId = new Types.ObjectId(dto.productId);
    const existingIndex = cart.items.findIndex(
      (item) => String(item.product) === dto.productId,
    );

    const items = [...cart.items];

    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + dto.quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: newQuantity,
        priceAtAdd,
      };
    } else {
      items.push({
        product: productObjectId,
        quantity: dto.quantity,
        priceAtAdd,
      });
    }

    let coupon: Coupon | null = null;
    if (cart.appliedCoupon) {
      coupon = await this.couponService.findById(String(cart.appliedCoupon));
    }

    const totals = this.calculateTotals(items, coupon);
    const updated = await this.cartRepository.updateOne({
      filter: { user: userId },
      update: { $set: { items, ...totals } },
    });

    return { message: 'Item added to cart', data: updated };
  }

  async updateItem(user: IUser, productId: string, quantity: number) {
    const userId = this.getUserId(user);
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => String(item.product) === productId,
    );

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productRepository.findById({ id: productId });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const items = [...cart.items];
    items[itemIndex] = {
      ...items[itemIndex],
      quantity,
      priceAtAdd: this.getEffectivePrice(product),
    };

    let coupon: Coupon | null = null;
    if (cart.appliedCoupon) {
      coupon = await this.couponService.findById(String(cart.appliedCoupon));
    }

    const totals = this.calculateTotals(items, coupon);
    const updated = await this.cartRepository.updateOne({
      filter: { user: userId },
      update: { $set: { items, ...totals } },
    });

    return { message: 'Cart item updated', data: updated };
  }

  async removeItem(user: IUser, productId: string) {
    const userId = this.getUserId(user);
    const cart = await this.getOrCreateCart(userId);
    const items = cart.items.filter(
      (item) => String(item.product) !== productId,
    );

    if (items.length === cart.items.length) {
      throw new NotFoundException('Item not found in cart');
    }

    let coupon: Coupon | null = null;
    if (cart.appliedCoupon) {
      coupon = await this.couponService.findById(String(cart.appliedCoupon));
      if (coupon) {
        this.couponService.validateCoupon(coupon, items);
      }
    }

    const totals = this.calculateTotals(items, coupon);
    const updated = await this.cartRepository.updateOne({
      filter: { user: userId },
      update: { $set: { items, ...totals } },
    });

    return { message: 'Item removed from cart', data: updated };
  }

  async clearCart(user: IUser) {
    const userId = this.getUserId(user);
    await this.cartRepository.clearCart(userId);
    return { message: 'Cart cleared', data: null };
  }

  async applyCoupon(user: IUser, dto: ApplyCouponDto) {
    const userId = this.getUserId(user);
    const cart = await this.getOrCreateCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const coupon = await this.couponService.findByCode(dto.code);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    this.couponService.validateCoupon(coupon, cart.items);
    const totals = this.calculateTotals(cart.items, coupon);

    const updated = await this.cartRepository.updateOne({
      filter: { user: userId },
      update: {
        $set: {
          appliedCoupon: coupon._id,
          ...totals,
        },
      },
    });

    return { message: 'Coupon applied', data: updated };
  }
}
