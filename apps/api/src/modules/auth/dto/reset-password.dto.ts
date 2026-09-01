import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsPhoneNumber('VN')
  phone!: string;

  @ApiProperty()
  @Length(6, 6)
  otpCode!: string;

  @ApiProperty()
  @MinLength(6)
  newPassword!: string;
}
