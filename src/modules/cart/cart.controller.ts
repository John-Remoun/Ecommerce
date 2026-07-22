import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IUser } from 'src/common/interface/user.interface';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller({ path: 'cart', version: '1' })
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: IUser) {
    return this.cartService.getCart(user);
  }

  @Post('items')
  addItem(@CurrentUser() user: IUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user, dto);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: IUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user, productId, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: IUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user, productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: IUser) {
    return this.cartService.clearCart(user);
  }

  @Post('apply-coupon')
  applyCoupon(@CurrentUser() user: IUser, @Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(user, dto);
  }
}
