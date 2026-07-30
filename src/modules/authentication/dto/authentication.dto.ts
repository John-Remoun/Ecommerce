import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsMatch } from 'src/common/decorator';
import { logoutEnum } from 'src/common/enum/token.enum';

export class LoginDto {
  @IsEmail({})
  email!: string;

  @IsStrongPassword({
    minNumbers: 3,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  password!: string;
}

export class SignupDto extends LoginDto {
  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  username!: string;

  @ValidateIf((data: SignupDto) => Boolean(data.password))
  @IsMatch('password')
  confirmPassword!: string;

  @IsNotEmpty()
  @MaxLength(11)
  phone?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @IsEnum(logoutEnum)
  mode: logoutEnum = logoutEnum.ONLY;
}

export class ConfirmEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsStrongPassword({
    minNumbers: 3,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  newPassword!: string;
}

export class SignupQueryDto {
  @Transform(({ value }) => {
    if (value == 'true') value = Boolean(true);
    if (value == 'false') value = Boolean(false);
    return value;
  })
  @IsBoolean()
  flag!: boolean;
}
