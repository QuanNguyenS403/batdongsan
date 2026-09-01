import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '0901234567' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phone!: string;
}
