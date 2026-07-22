import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/common/repository';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(email: string) {
    const user = await this.userRepository.findOne({ filter: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const json = user.toJSON() as unknown as Record<string, unknown> & {
      password?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = json;
    return profile;
  }

  async changePassword(email: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ filter: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userRepository.updateOne({
      filter: { email },
      update: {
        $set: {
          password: dto.newPassword,
          changeCredentialsTime: new Date(),
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      },
    });

    return { message: 'Password changed successfully', data: null };
  }
}
