import { Module } from '@nestjs/common';
import { ProductModel } from 'src/model/product.model';

import { CategoryModule } from '../category/category.module';
import { BrandModule } from '../brand/brand.module';

import { ProductController } from './product.controller';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';

@Module({
  imports: [
    ProductModel,
    CategoryModule,
    BrandModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductRepository],
})
export class ProductModule {}