import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { IUser } from '../interface/user.interface';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: IUser & { _id?: string };
      params: { id?: string; userId?: string };
      body: { user?: string };
    }>();

    const user = request.user;
    const resourceUserId =
      request.params.userId ?? request.body?.user ?? request.params.id;

    if (!user || !resourceUserId) {
      return true;
    }

    const userId = String((user as IUser & { _id?: string })._id ?? '');

    if (user.role === 'ADMIN') {
      return true;
    }

    if (userId && resourceUserId && userId !== String(resourceUserId)) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}
