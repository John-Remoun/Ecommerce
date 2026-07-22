import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IUser } from 'src/common/interface/user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller({ path: 'user', version: '1' })
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async profile(@CurrentUser() user: IUser) {
    const profile = await this.userService.getProfile(user.email);
    return { message: 'Profile retrieved', data: profile };
  }

  @Patch('password')
  async changePassword(
    @CurrentUser() user: IUser,
    @Body() body: ChangePasswordDto,
  ) {
    return await this.userService.changePassword(user.email, body);
  }
}
