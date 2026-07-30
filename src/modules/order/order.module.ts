import { Module } from '@nestjs/common';
import { OrderModel } from 'src/model/order.model';
import { ProductModel } from 'src/model/product.model';
import { MailModule } from 'src/common/module/mail/mail.module';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupon/coupon.module';
import { ProductRepository } from '../product/product.repository';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
  imports: [OrderModel, ProductModel, CartModule, CouponModule, MailModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, ProductRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
