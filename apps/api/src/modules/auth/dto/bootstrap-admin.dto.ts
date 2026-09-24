import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class BootstrapAdminDto {
  @ApiProperty({ description: 'Secret bootstrap admin cấu hình trong biến môi trường ADMIN_BOOTSTRAP_SECRET' })
  @IsString()
  @IsNotEmpty({ message: 'Secret bootstrap không được để trống.' })
  secret!: string;

  @ApiProperty({ description: 'Số điện thoại quản trị viên (10 chữ số VN)' })
  @Matches(/^0[35789][0-9]{8}$/, { message: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09).' })
  phone!: string;

  @ApiProperty({ description: 'Mật khẩu quản trị viên mới' })
  @IsString()
  @Length(8, 100, { message: 'Mật khẩu phải từ 8 đến 100 ký tự.' })
  password!: string;

  @ApiProperty({ description: 'Họ và tên quản trị viên', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;
}
