import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class QueryProductDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
