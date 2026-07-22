import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RoleEnum } from 'src/common/enum/user.enums';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import type { IUser } from 'src/common/interface/user.interface';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller({ path: 'order', version: '1' })
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: IUser, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: IUser, @Query() query: PaginationQueryDto) {
    return this.orderService.findUserOrders(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.orderService.findOne(user, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.orderService.cancelOrder(user, id);
  }
}
