import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { IUser } from 'src/common/interface/user.interface';
import { WishlistService } from './wishlist.service';

@Controller({ path: 'wishlist', version: '1' })
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async add(
    @CurrentUser() user: IUser & { _id?: string },
    @Param('productId') productId: string,
  ) {
    const wishlist = await this.wishlistService.add(
      user._id?.toString() ?? '',
      productId,
    );

    return { message: 'Product added to wishlist', data: wishlist };
  }

  @Delete(':productId')
  async remove(
    @CurrentUser() user: IUser & { _id?: string },
    @Param('productId') productId: string,
  ) {
    const wishlist = await this.wishlistService.remove(
      user._id?.toString() ?? '',
      productId,
    );

    return { message: 'Product removed from wishlist', data: wishlist };
  }

  @Get()
  async list(@CurrentUser() user: IUser & { _id?: string }) {
    const wishlist = await this.wishlistService.list(
      user._id?.toString() ?? '',
    );

    return { message: 'Wishlist retrieved', data: wishlist };
  }
}
