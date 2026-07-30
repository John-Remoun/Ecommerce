import { Module } from '@nestjs/common';
import { ProductModel } from 'src/model/product.model';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ProductModel],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
