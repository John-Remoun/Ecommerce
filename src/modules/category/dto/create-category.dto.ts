import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
