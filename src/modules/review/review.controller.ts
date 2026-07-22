import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { IUser } from 'src/common/interface/user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@Controller({ path: 'reviews', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: IUser & { _id?: string },
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewService.create(
      user._id?.toString() ?? '',
      dto,
    );

    return { message: 'Review created', data: review };
  }

  @Get('product/:productId')
  async findByProduct(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.reviewService.findByProduct(productId, query);
    return { message: 'Reviews retrieved', data: result };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: IUser & { _id?: string },
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.reviewService.update(
      user._id?.toString() ?? '',
      id,
      dto,
    );

    return { message: 'Review updated', data: review };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: IUser & { _id?: string },
    @Param('id') id: string,
  ) {
    const result = await this.reviewService.remove(
      user._id?.toString() ?? '',
      id,
    );

    return { message: 'Review deleted', data: result };
  }
}
