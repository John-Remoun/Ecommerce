import { Module } from '@nestjs/common';
import { CouponModel } from 'src/model/coupon.model';
import { AuthenticationModule } from '../authentication/authentication.module';
import { CouponController } from './coupon.controller';
import { CouponRepository } from './coupon.repository';
import { CouponService } from './coupon.service';

@Module({
  imports: [CouponModel, AuthenticationModule],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
  exports: [CouponService, CouponRepository],
})
export class CouponModule {}
