import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { OrderModel } from 'src/model/order.model';
import { ProductModel } from 'src/model/product.model';
import { Review, ReviewSchema } from './model/review.model';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    OrderModel,
    ProductModel,
    AuthenticationModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
