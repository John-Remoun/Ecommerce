import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Coupon } from 'src/model/coupon.model';

@Injectable()
export class CouponRepository extends DatabaseRepository<Coupon> {
  constructor(
    @InjectModel(Coupon.name)
    protected readonly model: Model<Coupon>,
  ) {
    super(model);
  }

  async findByCode(code: string) {
    return this.findOne({
      filter: { code: code.toUpperCase().trim() },
    });
  }
}
