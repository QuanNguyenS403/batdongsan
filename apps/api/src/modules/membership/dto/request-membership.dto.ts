import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestMembershipDto {
  @ApiProperty({ description: 'ID của gói thành viên muốn mua/nâng cấp', example: 2 })
  @IsNotEmpty({ message: 'Vui lòng chọn gói thành viên' })
  @IsInt({ message: 'ID gói thành viên phải là số nguyên' })
  planId!: number;

  @ApiPropertyOptional({
    description: 'Ghi chú thanh toán hoặc mã giao dịch chuyển khoản ngân hàng',
    example: 'Đã chuyển 499.000đ từ Vietcombank NGUYEN DUC QUAN',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  paymentNote?: string;
}
