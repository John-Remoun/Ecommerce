import { Module, forwardRef } from '@nestjs/common';
import { CartModel } from 'src/model/cart.model';
import { ProductModel } from 'src/model/product.model';
import { AuthenticationModule } from '../authentication/authentication.module';
import { CouponModule } from '../coupon/coupon.module';
import { ProductRepository } from '../product/product.repository';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

@Module({
  imports: [
    CartModel,
    ProductModel,
    forwardRef(() => CouponModule),
    AuthenticationModule,
  ],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
  exports: [CartService, CartRepository],
})
export class CartModule {}
