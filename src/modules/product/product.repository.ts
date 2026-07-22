import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, PopulateOptions, QueryFilter } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Product } from 'src/model/product.model';

@Injectable()
export class ProductRepository extends DatabaseRepository<Product> {
  constructor(
    @InjectModel(Product.name)
    protected readonly model: Model<Product>,
  ) {
    super(model);
  }

  async paginateWithFilters({
    filter = {},
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    useTextScore = false,
    populate,
  }: {
    filter?: QueryFilter<Product>;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    useTextScore?: boolean;
    populate?: PopulateOptions | PopulateOptions[];
  }) {
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const query = this.model.find(
      filter,
      useTextScore ? { score: { $meta: 'textScore' } } : undefined,
    );

    if (useTextScore) {
      query.sort({ score: { $meta: 'textScore' } });
    } else {
      query.sort({ [sort]: sortOrder } as Record<string, 1 | -1>);
    }

    const [docs, total] = await Promise.all([
      query
        .skip(skip)
        .limit(limit)
        .populate(populate as PopulateOptions[])
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      docs,
      currentPage: page,
      pages: Math.ceil(total / limit) || 1,
      size: docs.length,
      total,
    };
  }

  async decrementStock({
    productId,
    quantity,
    session,
  }: {
    productId: string;
    quantity: number;
    session?: ClientSession;
  }) {
    const product = await this.model
      .findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity }, deletedAt: null },
        { $inc: { stock: -quantity } },
        { new: true, session },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Insufficient stock for product');
    }

    return product;
  }

  async incrementStock({
    productId,
    quantity,
    session,
  }: {
    productId: string;
    quantity: number;
    session?: ClientSession;
  }) {
    const product = await this.model
      .findOneAndUpdate(
        { _id: productId, deletedAt: null },
        { $inc: { stock: quantity } },
        { new: true, session },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
