import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectListingDto {
  @ApiProperty({ description: 'Lý do từ chối tin đăng', example: 'Ảnh mờ hoặc không đúng thực tế' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  @MaxLength(500, { message: 'Lý do từ chối không vượt quá 500 ký tự' })
  reason!: string;
}
