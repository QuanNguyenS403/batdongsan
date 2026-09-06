import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectListingDto {
  @ApiPropertyOptional({ description: 'Lý do từ chối tin đăng', example: 'Ảnh mờ hoặc không đúng thực tế' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do từ chối không vượt quá 500 ký tự' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Alias lý do từ chối (tương thích frontend)', example: 'Ảnh mờ hoặc không đúng thực tế' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do từ chối không vượt quá 500 ký tự' })
  rejectionReason?: string;
}

