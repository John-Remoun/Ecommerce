import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from 'src/common/repository';
import { IUser } from 'src/common/interface/user.interface';

export interface JwtPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('User_TOKEN_SECRET_KEY') ??
        'development-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      filter: { email: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      user.changeCredentialsTime &&
      payload.iat &&
      user.changeCredentialsTime.getTime() / 1000 > payload.iat
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const json = user.toJSON() as IUser & { password?: string };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = json;
    return safeUser as IUser;
  }
}
