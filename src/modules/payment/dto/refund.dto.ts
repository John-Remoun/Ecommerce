import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsMongoId()
  orderId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
