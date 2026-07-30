import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserModel } from 'src/model/user.model';
import { AuthenticationController } from './auth.controller';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from 'src/common/repository';
import { SecurityModule } from 'src/common/module/security/security.module';
import { MailModule } from 'src/common/module/mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModel,
    SecurityModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('User_TOKEN_SECRET_KEY'),
        signOptions: {
          expiresIn: Number(
            configService.get<string>('ACCESS_EXPIRES_IN') ?? 1800,
          ),
        },
      }),
    }),
  ],
  exports: [AuthenticationService, JwtModule, PassportModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, UserRepository, JwtStrategy],
})
export class AuthenticationModule {}
