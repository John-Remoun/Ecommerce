import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, QueryFilter, Types } from 'mongoose';
import { Product } from 'src/model/product.model';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async search(query: SearchQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<Product> = { isActive: true };

    if (query.q?.trim()) {
      filter.$text = { $search: query.q.trim() };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    if (query.brand) {
      filter.brand = new Types.ObjectId(query.brand);
    }

    if (query.category) {
      filter.category = new Types.ObjectId(query.category);
    }

    const docsPipeline: PipelineStage[] = [
      ...(query.q?.trim()
        ? [{ $addFields: { score: { $meta: 'textScore' } } } as PipelineStage]
        : []),
      query.q?.trim()
        ? ({ $sort: { score: { $meta: 'textScore' } } } as PipelineStage)
        : ({
            $sort: {
              [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1,
            },
          } as PipelineStage),
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'Ecommerce_APP_BRANDS',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'Ecommerce_APP_CATEGORIES',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ['$brand', 0] },
          category: { $arrayElemAt: ['$category', 0] },
        },
      },
    ];

    const facetPipeline: PipelineStage[] = [
      { $match: filter },
      {
        $facet: {
          docs: docsPipeline as PipelineStage.FacetPipelineStage[],
          total: [{ $count: 'count' }],
          priceFacet: [
            {
              $group: {
                _id: null,
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
              },
            },
          ],
          brandFacet: [
            { $match: { brand: { $ne: null } } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
          categoryFacet: [
            { $match: { category: { $ne: null } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
        },
      },
    ];

    const [result] = await this.productModel.aggregate(facetPipeline);
    const total = result?.total?.[0]?.count ?? 0;

    return {
      docs: result?.docs ?? [],
      facets: {
        price: result?.priceFacet?.[0] ?? { minPrice: 0, maxPrice: 0 },
        brands: result?.brandFacet ?? [],
        categories: result?.categoryFacet ?? [],
      },
      currentPage: page,
      pages: Math.ceil(total / limit) || 1,
      size: result?.docs?.length ?? 0,
      total,
    };
  }
}
