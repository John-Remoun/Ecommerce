import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parent) {
      const parent = await this.categoryRepository.findById({ id: dto.parent });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.categoryRepository.createOne({ data: dto });
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const result = await this.categoryRepository.paginate({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      populate: { path: 'parent', select: 'name slug' },
    });

    return {
      message: 'Categories retrieved successfully',
      data: result,
    };
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById({
      id,
      options: { populate: { path: 'parent', select: 'name slug' } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.categoryRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.parent) {
      if (dto.parent === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.categoryRepository.findById({ id: dto.parent });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const update: Record<string, unknown> = { ...dto };
    if (dto.name) {
      update.slug = this.generateSlug(dto.name);
    }

    const category = await this.categoryRepository.updateOne({
      filter: { _id: id },
      update: { $set: update },
    });

    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  async remove(id: string) {
    const existing = await this.categoryRepository.findById({ id });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.updateOne({
      filter: { _id: id },
      update: { $set: { deletedAt: new Date() } },
    });

    return {
      message: 'Category deleted successfully',
      data: null,
    };
  }

  async findChildren(id: string) {
    const parent = await this.categoryRepository.findById({ id });
    if (!parent) {
      throw new NotFoundException('Category not found');
    }

    const children = await this.categoryRepository.findMany({
      filter: { parent: id },
    });

    return {
      message: 'Category children retrieved',
      data: children,
    };
  }

  async findTree() {
    const categories = await this.categoryRepository.findMany({
      filter: {},
    });

    const roots = categories.filter((c) => !c.parent);
    const buildTree = (parentId: string) =>
      categories
        .filter((c) => String(c.parent) === String(parentId))
        .map((c) => ({
          ...c.toJSON(),
          children: buildTree(String(c._id)),
        }));

    const tree = roots.map((root) => ({
      ...root.toJSON(),
      children: buildTree(String(root._id)),
    }));

    return {
      message: 'Category tree retrieved',
      data: tree,
    };
  }
}
