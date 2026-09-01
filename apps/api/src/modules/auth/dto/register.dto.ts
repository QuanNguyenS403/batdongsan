import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '0901234567' })
  @IsPhoneNumber('VN')
  phone!: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP đã gửi tới số điện thoại' })
  @Length(6, 6)
  otpCode!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: 'MatKhau@123' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password!: string;
}
