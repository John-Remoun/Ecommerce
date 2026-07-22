import { IsString, MinLength } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @MinLength(2)
  code!: string;
}
