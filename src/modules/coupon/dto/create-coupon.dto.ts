import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CouponTypeEnum } from 'src/common/enum/coupon.enum';

export class CreateCouponDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsEnum(CouponTypeEnum)
  type!: CouponTypeEnum;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxUses!: number;

  @Type(() => Date)
  @IsDate()
  expiresAt!: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
