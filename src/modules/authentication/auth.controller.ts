import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignupDto,
} from './dto/authentication.dto';
import { AuthenticationService } from './authentication.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IUser } from 'src/common/interface/user.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return await this.authenticationService.signup(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.authenticationService.login(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.authenticationService.refresh(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: IUser, @Body() body: LogoutDto) {
    return await this.authenticationService.logout(user.email, body.mode);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('confirm-email')
  async confirmEmail(@Body() body: ConfirmEmailDto) {
    return await this.authenticationService.confirmEmail(body.email, body.otp);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authenticationService.forgotPassword(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authenticationService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }
}
