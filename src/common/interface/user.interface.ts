import { Types } from 'mongoose';
import { GenderEnum, ProviderEnum, RoleEnum } from '../enum';
import { Permission } from '../enum/permission.enum';

export interface IUser {
  _id?: Types.ObjectId | string;
  firstName: string;
  lastName: string;
  username?: string;
  slug: string;

  email: string;
  password: string;

  phone?: string;
  profilePicture?: string;
  profileCoverPicture?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;
  permissions?: Permission[];

  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  emailVerificationOtpHash?: string;
  emailVerificationOtpExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  deletedAt?: Date | null;

  wishlist?: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}
