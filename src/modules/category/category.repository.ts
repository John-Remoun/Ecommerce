import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Category } from 'src/model/category.model';

@Injectable()
export class CategoryRepository extends DatabaseRepository<Category> {
  constructor(
    @InjectModel(Category.name)
    protected readonly model: Model<Category>,
  ) {
    super(model);
  }
}
