import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from '../interface/user.interface';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const requireVerification =
      this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true';

    if (!requireVerification) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: IUser }>();

    if (!user?.confirmEmail) {
      throw new ForbiddenException('Email verification required');
    }

    return true;
  }
}
