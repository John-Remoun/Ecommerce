import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/model/user.model';
import { Product } from 'src/model/product.model';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async add(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: new Types.ObjectId(productId) } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.wishlist ?? [];
  }

  async remove(userId: string, productId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: new Types.ObjectId(productId) } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.wishlist ?? [];
  }

  async list(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('wishlist', 'title slug price images ratingsAverage')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.wishlist ?? [];
  }
}
