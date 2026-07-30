import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Cart } from 'src/model/cart.model';

@Injectable()
export class CartRepository extends DatabaseRepository<Cart> {
  constructor(
    @InjectModel(Cart.name)
    protected readonly model: Model<Cart>,
  ) {
    super(model);
  }

  async findByUserId(userId: string) {
    return this.findOne({
      filter: { user: userId },
      options: {
        populate: [
          {
            path: 'items.product',
            select: 'title slug price discountPrice images stock isActive',
          },
          {
            path: 'appliedCoupon',
            select:
              'code type value minOrderValue maxUses usedCount expiresAt isActive',
          },
        ],
      },
    });
  }

  async clearCart(userId: string, session?: ClientSession) {
    return this.updateOne({
      filter: { user: userId },
      update: {
        $set: {
          items: [],
          appliedCoupon: null,
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
        },
      },
      options: { session },
    });
  }
}
