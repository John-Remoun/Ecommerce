import { Module } from '@nestjs/common';
import { BrandModel } from 'src/model/brand.model';
import { BrandController } from './brand.controller';
import { BrandRepository } from './brand.repository';
import { BrandService } from './brand.service';

@Module({
  imports: [BrandModel],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService, BrandRepository],
})
export class BrandModule {}
