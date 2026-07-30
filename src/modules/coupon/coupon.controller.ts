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
import { Roles } from 'src/common/decorator/roles.decorator';
import { RoleEnum } from 'src/common/enum/user.enums';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller({ path: 'coupon', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.couponService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
