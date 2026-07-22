import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrderStatusEnum, PaymentStatusEnum } from 'src/common/enum/order.enum';
import { IUser } from 'src/common/interface/user.interface';
import { OrderService } from '../order/order.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund.dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly orderService: OrderService,
  ) {}

  private getStripe(): Stripe {
    if (!this.stripe) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
      }
      this.stripe = new Stripe(secretKey);
    }
    return this.stripe;
  }

  async createPaymentIntent(user: IUser, dto: CreatePaymentIntentDto) {
    const { data: order } = await this.orderService.findOne(user, dto.orderId);

    if (order.paymentStatus === PaymentStatusEnum.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (order.status === OrderStatusEnum.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    const amountInCents = Math.round(order.total * 100);

    const paymentIntent = await this.getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        orderId: String(order._id),
        userId: String(user._id ?? ''),
      },
    });

    await this.orderService.updatePaymentStatus({
      orderId: dto.orderId,
      paymentStatus: PaymentStatusEnum.PENDING,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      message: 'Payment intent created',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${error}`,
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          await this.orderService.updatePaymentStatus({
            orderId,
            paymentStatus: PaymentStatusEnum.PAID,
            stripePaymentIntentId: paymentIntent.id,
            status: OrderStatusEnum.CONFIRMED,
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          await this.orderService.updatePaymentStatus({
            orderId,
            paymentStatus: PaymentStatusEnum.FAILED,
            stripePaymentIntentId: paymentIntent.id,
          });
        }
        break;
      }
      default:
        break;
    }

    return { message: 'Webhook processed', data: { received: true } };
  }

  async refund(dto: RefundPaymentDto): Promise<{
    message: string;
    data: { refundId: string; status: string };
  }> {
    const order = await this.orderService.findById(dto.orderId);

    if (!order.stripePaymentIntentId) {
      throw new BadRequestException('Order has no associated payment');
    }

    if (order.paymentStatus !== PaymentStatusEnum.PAID) {
      throw new BadRequestException('Order is not paid');
    }

    const refund = await this.getStripe().refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: dto.reason as Stripe.RefundCreateParams.Reason | undefined,
    });

    await this.orderService.updatePaymentStatus({
      orderId: dto.orderId,
      paymentStatus: PaymentStatusEnum.REFUNDED,
      status: OrderStatusEnum.REFUNDED,
    });

    return {
      message: 'Refund processed',
      data: { refundId: refund.id, status: refund.status ?? 'unknown' },
    };
  }
}
