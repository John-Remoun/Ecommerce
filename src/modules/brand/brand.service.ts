import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }

async create(dto: CreateBrandDto) {
  try {
    const brand = await this.brandRepository.createOne({
      data: {
        ...dto,
        slug: this.generateSlug(dto.name),
      },
    });

    return {
      message: 'Brand created successfully',
      data: brand,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

  async findAll(query: PaginationQueryDto) {
    const result = await this.brandRepository.paginate({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
    });

    return {
      message: 'Brands retrieved successfully',
      data: result,
    };
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findById({ id });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand retrieved successfully',
      data: brand,
    };
  }

  async update(id: string, dto: UpdateBrandDto) {
    const existing = await this.brandRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Brand not found');
    }

    const update: Record<string, unknown> = { ...dto };
    if (dto.name) {
      update.slug = this.generateSlug(dto.name);
    }

    const brand = await this.brandRepository.updateOne({
      filter: { _id: id },
      update: { $set: update },
    });

    return {
      message: 'Brand updated successfully',
      data: brand,
    };
  }

  async remove(id: string) {
    const existing = await this.brandRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Brand not found');
    }

    await this.brandRepository.updateOne({
      filter: { _id: id },
      update: { $set: { deletedAt: new Date() } },
    });

    return {
      message: 'Brand deleted successfully',
      data: null,
    };
  }
}
