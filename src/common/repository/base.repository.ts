import { Injectable } from '@nestjs/common';
import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  UpdateResult,
} from 'mongoose';

@Injectable()
export abstract class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc> | AnyKeys<TRawDoc>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDoc> | HydratedDocument<TRawDoc>[]> {
    return (await this.model.create(data as any, options)) as any;
  }

  async insertMany({
    data,
  }: {
    data: AnyKeys<TRawDoc>[];
  }): Promise<HydratedDocument<TRawDoc>[]> {
    return (await this.model.create(data as any)) as any;
  }

 async createOne({
  data,
  options,
}: {
  data: AnyKeys<TRawDoc>;
  options?: CreateOptions;
}): Promise<HydratedDocument<TRawDoc>> {

  console.log('Repository Data:', data);

  return (await this.model.create(data as any, options)) as any;
}

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>[]> {
    const query = this.model.find(filter, projection);

    if (options?.populate) {
      query.populate(options.populate as PopulateOptions[]);
    }

    if (options?.lean) {
      query.lean(options.lean);
    }

    return query.exec();
  }

  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return this.model.findById(id, projection, options).exec();
  }

  async findMany({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>[]> {
    return this.model.find(filter, projection, options).exec();
  }

  async countDocuments({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<number> {
    return this.model.countDocuments(filter, options as any).exec();
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return this.model
      .findOneAndUpdate(filter, update, {
        new: true,
        includeResultMetadata: false,
        ...options,
      })
      .exec();
  }

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<UpdateResult> {
    return this.model.updateMany(filter, update, options as any).exec();
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return this.model.findOneAndDelete(filter, options).exec();
  }

  async deleteMany({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<DeleteResult> {
    return this.model.deleteMany(filter, options as any).exec();
  }

  async paginate({
    filter = {},
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    projection,
    populate,
  }: {
    filter?: QueryFilter<TRawDoc>;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    projection?: ProjectionType<TRawDoc>;
    populate?: PopulateOptions | PopulateOptions[];
  }) {
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter, projection)
        .sort({ [sort]: sortOrder } as any)
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
}
