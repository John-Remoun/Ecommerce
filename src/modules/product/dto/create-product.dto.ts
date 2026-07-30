import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPrice?: number;

  @IsMongoId()
  category!: string;

  @IsMongoId()
  brand!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  images?: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  sku!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}
