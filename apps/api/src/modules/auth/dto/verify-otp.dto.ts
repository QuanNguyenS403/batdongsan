import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '0901234567' })
  @IsPhoneNumber('VN')
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6, { message: 'Mã OTP phải gồm 6 chữ số' })
  code!: string;
}
