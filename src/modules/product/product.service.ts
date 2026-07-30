import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { Product } from 'src/model/product.model';
import { BrandRepository } from '../brand/brand.repository';
import { CategoryRepository } from '../category/category.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }

  private async validateReferences(categoryId: string, brandId: string) {
    const [category, brand] = await Promise.all([
      this.categoryRepository.findById({ id: categoryId }),
      this.brandRepository.findById({ id: brandId }),
    ]);

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
  }

  private buildFilter(query: QueryProductDto): QueryFilter<Product> {
    const filter: QueryFilter<Product> = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.brand) {
      filter.brand = query.brand;
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

    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }

    return filter;
  }

  async create(dto: CreateProductDto) {
    await this.validateReferences(dto.category, dto.brand);

    const product = await this.productRepository.createOne({
      data: {
        ...dto,
        slug: this.generateSlug(dto.title),
        images: dto.images ?? [],
      },
    });

    return {
      message: 'Product created successfully',
      data: product,
    };
  }

  async findAll(query: QueryProductDto) {
    const filter = this.buildFilter(query);
    const useTextScore = Boolean(query.search?.trim());

    const result = await this.productRepository.paginateWithFilters({
      filter,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      useTextScore,
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
      ],
    });

    return {
      message: 'Products retrieved successfully',
      data: result,
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findById({
      id,
      options: {
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'brand', select: 'name slug' },
        ],
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.productRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const categoryId = dto.category ?? String(existing.category);
    const brandId = dto.brand ?? String(existing.brand);

    if (dto.category || dto.brand) {
      await this.validateReferences(categoryId, brandId);
    }

    const update: Record<string, unknown> = { ...dto };

    if (dto.title) {
      update.slug = this.generateSlug(dto.title);
    }

    const product = await this.productRepository.updateOne({
      filter: { _id: id },
      update: { $set: update },
    });

    return {
      message: 'Product updated successfully',
      data: product,
    };
  }

  async remove(id: string) {
    const existing = await this.productRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.updateOne({
      filter: { _id: id },
      update: { $set: { deletedAt: new Date() } },
    });

    return {
      message: 'Product deleted successfully',
      data: null,
    };
  }
}
