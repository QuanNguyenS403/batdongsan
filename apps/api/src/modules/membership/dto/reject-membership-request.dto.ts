import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectMembershipRequestDto {
  @ApiPropertyOptional({
    description: 'Lý do từ chối yêu cầu gói',
    example: 'Không nhận được tiền chuyển khoản sau 3 ngày hoặc nội dung chuyển khoản sai',
  })
  @IsOptional()
  @IsString({ message: 'Lý do từ chối phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Lý do từ chối tối đa 500 ký tự' })
  reason?: string;
}
