import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { OrderStatusEnum, PaymentStatusEnum } from 'src/common/enum/order.enum';
import { RoleEnum } from 'src/common/enum/user.enums';
import { IUser } from 'src/common/interface/user.interface';
import { MailService } from 'src/common/module/mail/mail.service';
import { Coupon } from 'src/model/coupon.model';
import { CartRepository } from '../cart/cart.repository';
import { CouponService } from '../coupon/coupon.service';
import { CouponRepository } from '../coupon/coupon.repository';
import { ProductRepository } from '../product/product.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderRepository } from './order.repository';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

const SHIPPING_COST = 10;
const FREE_SHIPPING_THRESHOLD = 100;

const ORDER_STATUS_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
  [OrderStatusEnum.PENDING]: [
    OrderStatusEnum.CONFIRMED,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.CONFIRMED]: [
    OrderStatusEnum.SHIPPED,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED],
  [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.REFUNDED],
  [OrderStatusEnum.CANCELLED]: [],
  [OrderStatusEnum.REFUNDED]: [],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponService: CouponService,
    private readonly couponRepository: CouponRepository,
    private readonly mailService: MailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private getUserId(user: IUser): string {
    const userId = user._id;
    if (!userId) {
      throw new BadRequestException('Invalid user context');
    }
    return String(userId);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private calculateShippingCost(subtotal: number): number {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  }

  async checkout(user: IUser, dto: CheckoutDto) {
    const userId = this.getUserId(user);
    const session = await this.connection.startSession();

    try {
      let order: any;

      await session.withTransaction(async () => {
        const cart = await this.cartRepository.findOne({
          filter: { user: userId },
          options: { session },
        });

        if (!cart || !cart.items.length) {
          throw new BadRequestException('Cart is empty');
        }

        let coupon: Coupon | null = null;
        if (cart.appliedCoupon) {
          coupon = await this.couponRepository.findById({
            id: String(cart.appliedCoupon),
            options: { session },
          });

          if (!coupon) {
            throw new BadRequestException('Applied coupon is invalid');
          }

          this.couponService.validateCoupon(coupon, cart.items);
        }

        for (const item of cart.items) {
          await this.productRepository.decrementStock({
            productId: String(item.product),
            quantity: item.quantity,
            session,
          });
        }

        if (coupon) {
          const updatedCoupon = await this.couponRepository.updateOne({
            filter: { _id: coupon._id, usedCount: { $lt: coupon.maxUses } },
            update: { $inc: { usedCount: 1 } },
            options: { session },
          });

          if (!updatedCoupon) {
            throw new BadRequestException('Coupon usage limit reached');
          }
        }

        const shippingCost = this.calculateShippingCost(cart.subtotal);
        const total = this.round(cart.total + shippingCost);

        const created = await this.orderRepository.createOne({
          data: {
            user: new Types.ObjectId(userId),
            items: cart.items.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtAdd,
            })),
            shippingAddress: dto.shippingAddress,
            coupon: cart.appliedCoupon,
            subtotal: cart.subtotal,
            discount: cart.discount,
            tax: cart.tax,
            shippingCost,
            total,
            status: OrderStatusEnum.PENDING,
            paymentStatus: PaymentStatusEnum.PENDING,
          },
          options: { session },
        });

        await this.cartRepository.clearCart(userId, session);
        order = created;
      });

      await this.mailService.sendOrderConfirmation(
        user.email,
        String(order._id),
      );

      return { message: 'Order placed successfully', data: order };
    } finally {
      await session.endSession();
    }
  }

  async findUserOrders(user: IUser, query: PaginationQueryDto) {
    const userId = this.getUserId(user);
    const result = await this.orderRepository.paginate({
      filter: { user: userId },
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      populate: { path: 'items.product', select: 'title slug images price' },
    });

    return { message: 'Orders retrieved', data: result };
  }

  async findOne(user: IUser, orderId: string) {
    const order = await this.orderRepository.findById({
      id: orderId,
      options: {
        populate: [
          { path: 'items.product', select: 'title slug images price' },
          { path: 'coupon', select: 'code type value' },
        ],
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const userId = this.getUserId(user);
    if (user.role !== RoleEnum.ADMIN && String(order.user) !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return { message: 'Order retrieved', data: order };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findById({ id: orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updated = await this.orderRepository.updateOne({
      filter: { _id: orderId },
      update: { $set: { status: dto.status } },
    });

    return { message: 'Order status updated', data: updated };
  }

  async cancelOrder(user: IUser, orderId: string) {
    const order = await this.orderRepository.findById({ id: orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const userId = this.getUserId(user);
    if (user.role !== RoleEnum.ADMIN && String(order.user) !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (
      ![OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED].includes(
        order.status,
      )
    ) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    const session = await this.connection.startSession();

    try {
      let updated: any;

      await session.withTransaction(async () => {
        for (const item of order.items) {
          await this.productRepository.incrementStock({
            productId: String(item.product),
            quantity: item.quantity,
            session,
          });
        }

        if (order.coupon) {
          await this.couponRepository.updateOne({
            filter: { _id: order.coupon },
            update: { $inc: { usedCount: -1 } },
            options: { session },
          });
        }

        updated = await this.orderRepository.updateOne({
          filter: { _id: orderId },
          update: {
            $set: {
              status: OrderStatusEnum.CANCELLED,
              paymentStatus:
                order.paymentStatus === PaymentStatusEnum.PAID
                  ? PaymentStatusEnum.REFUNDED
                  : order.paymentStatus,
            },
          },
          options: { session },
        });
      });

      return { message: 'Order cancelled', data: updated };
    } finally {
      await session.endSession();
    }
  }

  async updatePaymentStatus({
    orderId,
    paymentStatus,
    stripePaymentIntentId,
    status,
  }: {
    orderId: string;
    paymentStatus: PaymentStatusEnum;
    stripePaymentIntentId?: string;
    status?: OrderStatusEnum;
  }) {
    const update: Record<string, unknown> = { paymentStatus };
    if (stripePaymentIntentId) {
      update.stripePaymentIntentId = stripePaymentIntentId;
    }
    if (status) {
      update.status = status;
    }

    return this.orderRepository.updateOne({
      filter: { _id: orderId },
      update: { $set: update },
    });
  }

  async findByPaymentIntentId(paymentIntentId: string) {
    return this.orderRepository.findOne({
      filter: { stripePaymentIntentId: paymentIntentId },
    });
  }

  async findById(orderId: string) {
    const order = await this.orderRepository.findById({ id: orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
