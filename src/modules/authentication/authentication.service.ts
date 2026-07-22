import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { LoginDto, SignupDto } from './dto/authentication.dto';
import { UserRepository } from 'src/common/repository';
import { SecurityService } from 'src/common/module/security/security.service';
import { logoutEnum } from 'src/common/enum/token.enum';
import { MailService } from 'src/common/module/mail/mail.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateSlug(username: string): string {
    return username
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }

  private async issueTokens(user: { email: string; role: string }) {
    const accessExpiresIn = Number(
      this.configService.get<string>('ACCESS_EXPIRES_IN') ?? 1800,
    );
    const refreshExpiresIn = Number(
      this.configService.get<string>('REFRESH_EXPIRES_IN') ?? 31536000,
    );

    const payload = { sub: user.email, role: user.role };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get<string>('User_TOKEN_SECRET_KEY'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('User_REFRESH_TOKEN_SECRET_KEY'),
        expiresIn: refreshExpiresIn,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.userRepository.updateOne({
      filter: { email: user.email },
      update: {
        $set: {
          refreshTokenHash,
          refreshTokenExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
        },
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: { toJSON: () => Record<string, unknown> }) {
    const json = user.toJSON();
    delete json.password;
    delete json.refreshTokenHash;
    delete json.emailVerificationOtpHash;
    delete json.passwordResetTokenHash;
    return json;
  }

  async signup(data: SignupDto) {
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const slug = this.generateSlug(fullName || data.username);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = data;

    const user = await this.userRepository.createOne({
      data: {
        ...userData,
        slug,
      },
    });

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
    });

    await this.sendEmailVerificationOtp(user.email);

    return {
      message: 'Signup successful',
      data: {
        user: this.sanitizeUser(user),
        ...tokens,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      filter: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user),
        ...tokens,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('User_REFRESH_TOKEN_SECRET_KEY'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      filter: { email: payload.sub },
      options: { select: '+refreshTokenHash +refreshTokenExpiresAt' } as any,
    });

    if (!user?.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      user.changeCredentialsTime &&
      payload.iat &&
      user.changeCredentialsTime.getTime() / 1000 > payload.iat
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const tokens = await this.issueTokens({
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Token refreshed',
      data: tokens,
    };
  }

  async logout(email: string, mode: logoutEnum = logoutEnum.ONLY) {
    if (mode === logoutEnum.ALL) {
      await this.userRepository.updateOne({
        filter: { email },
        update: {
          $set: {
            changeCredentialsTime: new Date(),
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
          },
        },
      });
    } else {
      await this.userRepository.updateOne({
        filter: { email },
        update: {
          $set: {
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
          },
        },
      });
    }

    return { message: 'Logout successful', data: null };
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendEmailVerificationOtp(email: string) {
    const user = await this.userRepository.findOne({ filter: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.userRepository.updateOne({
      filter: { email },
      update: {
        $set: {
          emailVerificationOtpHash: otpHash,
          emailVerificationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
    });

    await this.mailService.sendConfirmEmail(email, otp);

    return { message: 'Verification email sent', data: null };
  }

  async confirmEmail(email: string, otp: string) {
    const user = await this.userRepository.findOne({
      filter: { email },
      options: {
        select: '+emailVerificationOtpHash +emailVerificationOtpExpiresAt',
      } as any,
    });

    if (
      !user?.emailVerificationOtpHash ||
      !user.emailVerificationOtpExpiresAt
    ) {
      throw new BadRequestException('No verification pending');
    }

    if (user.emailVerificationOtpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const isValid = await bcrypt.compare(otp, user.emailVerificationOtpHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userRepository.updateOne({
      filter: { email },
      update: {
        $set: {
          confirmEmail: new Date(),
          emailVerificationOtpHash: null,
          emailVerificationOtpExpiresAt: null,
        },
      },
    });

    return { message: 'Email confirmed', data: null };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ filter: { email } });
    if (!user) {
      return {
        message: 'If the email exists, a reset link was sent',
        data: null,
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.userRepository.updateOne({
      filter: { email },
      update: {
        $set: {
          passwordResetTokenHash: tokenHash,
          passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      },
    });

    await this.mailService.sendForgotPassword(email, token);

    return {
      message: 'If the email exists, a reset link was sent',
      data: null,
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      filter: { email },
      options: {
        select: '+passwordResetTokenHash +passwordResetTokenExpiresAt',
      } as any,
    });

    if (!user?.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    const isValid = await bcrypt.compare(token, user.passwordResetTokenHash);
    if (!isValid) {
      throw new BadRequestException('Invalid reset token');
    }

    await this.userRepository.updateOne({
      filter: { email },
      update: {
        $set: {
          password: newPassword,
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null,
          changeCredentialsTime: new Date(),
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      },
    });

    return { message: 'Password reset successful', data: null };
  }
}
