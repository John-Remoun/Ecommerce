import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ShippingAddressDto } from './shipping-address.dto';

export class CheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}
