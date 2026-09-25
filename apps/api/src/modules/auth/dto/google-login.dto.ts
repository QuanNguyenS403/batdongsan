import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID Token / Credential từ Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  credential!: string;

  @ApiPropertyOptional({ description: 'Số điện thoại của người dùng nếu tài khoản chưa có' })
  @IsOptional()
  @IsString()
  @Matches(/^0[35789][0-9]{8}$/, { message: 'Số điện thoại không đúng định dạng VN (10 chữ số)' })
  phone?: string;
}
