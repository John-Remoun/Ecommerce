import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Brand } from 'src/model/brand.model';

@Injectable()
export class BrandRepository extends DatabaseRepository<Brand> {
  constructor(
    @InjectModel(Brand.name)
    protected readonly model: Model<Brand>,
  ) {
    super(model);
  }
}
