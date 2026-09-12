import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ description: 'ID tin đăng người thuê quan tâm' })
  @IsNotEmpty({ message: 'listingId là bắt buộc' })
  listingId!: string;

  @ApiProperty({ description: 'Họ và tên người liên hệ' })
  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName!: string;

  @ApiProperty({ description: 'Số điện thoại di động Việt Nam (10 chữ số)' })
  @IsString()
  @Matches(/^(03|05|07|08|09)\d{8}$/, {
    message: 'Số điện thoại phải là số di động Việt Nam hợp lệ (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)',
  })
  phone!: string;

  @ApiPropertyOptional({ description: 'Email liên hệ' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Lời nhắn gửi cho chủ trọ / môi giới' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Lời nhắn tối đa 1000 ký tự' })
  message?: string;

  @ApiPropertyOptional({ description: 'Kênh gửi liên hệ (web_form, zalo, direct_call)', default: 'web_form' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string;

  @ApiProperty({ description: 'Đồng ý chia sẻ thông tin liên hệ', default: true })
  @IsBoolean({ message: 'consent phải là kiểu boolean' })
  @Equals(true, { message: 'Bạn cần đồng ý chia sẻ thông tin liên hệ để gửi yêu cầu' })
  consent!: boolean;
}
