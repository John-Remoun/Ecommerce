import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { ProductModel } from 'src/model/product.model';
import { UserModel } from 'src/model/user.model';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [UserModel, ProductModel, AuthenticationModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
