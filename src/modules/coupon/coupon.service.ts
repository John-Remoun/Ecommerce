import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartItem } from 'src/model/cart.model';
import { Coupon } from 'src/model/coupon.model';
import { CouponRepository } from './coupon.repository';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const coupon = await this.couponRepository.createOne({
      data: {
        ...dto,
        code: dto.code.toUpperCase().trim(),
        minOrderValue: dto.minOrderValue ?? 0,
        usedCount: 0,
        isActive: dto.isActive ?? true,
      },
    });

    return { message: 'Coupon created', data: coupon };
  }

  async findAll(query: PaginationQueryDto) {
    const result = await this.couponRepository.paginate({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
    });

    return { message: 'Coupons retrieved', data: result };
  }

  async findOne(id: string) {
    const coupon = await this.couponRepository.findById({ id });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { message: 'Coupon retrieved', data: coupon };
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.couponRepository.findById({ id });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (dto.code) {
      const existing = await this.couponRepository.findByCode(dto.code);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException('Coupon code already exists');
      }
      dto.code = dto.code.toUpperCase().trim();
    }

    const updated = await this.couponRepository.updateOne({
      filter: { _id: id },
      update: { $set: dto },
    });

    return { message: 'Coupon updated', data: updated };
  }

  async remove(id: string) {
    const coupon = await this.couponRepository.deleteOne({
      filter: { _id: id },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { message: 'Coupon deleted', data: coupon };
  }

  async findByCode(code: string) {
    return this.couponRepository.findByCode(code);
  }

  async findById(id: string) {
    return this.couponRepository.findById({ id });
  }

  validateCoupon(coupon: Coupon, items: CartItem[]) {
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );

    if (subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} not met`,
      );
    }
  }
}
