import { IsMongoId } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsMongoId()
  orderId!: string;
}
