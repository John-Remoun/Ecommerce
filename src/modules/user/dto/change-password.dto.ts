import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { IsMatch } from 'src/common/decorator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsStrongPassword({
    minNumbers: 3,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  newPassword!: string;

  @IsMatch('newPassword')
  confirmNewPassword!: string;
}
