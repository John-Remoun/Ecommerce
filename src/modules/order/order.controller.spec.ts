import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { ProductRepository } from '../product/product.repository';
import { CouponService } from '../coupon/coupon.service';
import { CouponRepository } from '../coupon/coupon.repository';
import { MailService } from 'src/common/module/mail/mail.service';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: {} },
        { provide: CartRepository, useValue: {} },
        { provide: ProductRepository, useValue: {} },
        { provide: CouponService, useValue: {} },
        { provide: CouponRepository, useValue: {} },
        {
          provide: MailService,
          useValue: { sendOrderConfirmation: jest.fn() },
        },
        {
          provide: getConnectionToken(),
          useValue: { startSession: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
