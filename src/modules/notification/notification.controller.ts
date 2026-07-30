import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { IUser } from 'src/common/interface/user.interface';
import { NotificationService } from './notification.service';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: IUser & { _id?: string },
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.notificationService.listByUser(
      user._id?.toString() ?? '',
      query,
    );

    return { message: 'Notifications retrieved', data: result };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: IUser & { _id?: string },
    @Param('id') id: string,
  ) {
    const notification = await this.notificationService.markRead(
      user._id?.toString() ?? '',
      id,
    );

    return { message: 'Notification marked as read', data: notification };
  }
}
