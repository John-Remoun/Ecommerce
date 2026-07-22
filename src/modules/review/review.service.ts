import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatusEnum } from 'src/common/enum/order.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Order } from 'src/model/order.model';
import { Product } from 'src/model/product.model';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './model/review.model';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  private async assertDeliveredOrder(userId: string, productId: string) {
    const order = await this.orderModel.findOne({
      user: new Types.ObjectId(userId),
      status: OrderStatusEnum.DELIVERED,
      'items.product': new Types.ObjectId(productId),
    });

    if (!order) {
      throw new ForbiddenException(
        'You can only review products from delivered orders',
      );
    }
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.productModel.findById(dto.productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.assertDeliveredOrder(userId, dto.productId);

    try {
      const review = await this.reviewModel.create({
        product: new Types.ObjectId(dto.productId),
        user: new Types.ObjectId(userId),
        rating: dto.rating,
        comment: dto.comment,
      });

      return review;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('You have already reviewed this product');
      }

      throw error;
    }
  }

  async findByProduct(productId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = { product: new Types.ObjectId(productId) };

    const [docs, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('user', 'firstName lastName profilePicture')
        .sort({ [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      docs,
      currentPage: page,
      pages: Math.ceil(total / limit) || 1,
      size: docs.length,
      total,
    };
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, dto);
    return review.save();
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await review.deleteOne();
    return { deleted: true };
  }
}
