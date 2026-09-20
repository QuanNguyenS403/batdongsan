import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RefundMembershipRequestDto {
  @ApiProperty({
    description: 'Lý do hoàn tiền cho khách hàng',
    example: 'Khách hàng đổi ý trong vòng 24h, chưa kích hoạt tin đăng nào',
  })
  @IsString({ message: 'Lý do hoàn tiền phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Lý do hoàn tiền không được để trống' })
  @MaxLength(500, { message: 'Lý do hoàn tiền tối đa 500 ký tự' })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Số tiền hoàn lại (VNĐ, số nguyên dương, không vượt quá số tiền đã thu)',
    example: 199000,
  })
  @IsOptional()
  @IsInt({ message: 'Số tiền hoàn lại phải là số nguyên' })
  @Min(1, { message: 'Số tiền hoàn lại phải lớn hơn 0' })
  refundAmount?: number;

  @ApiProperty({
    description: 'Mã giao dịch ngân hàng chuyển tiền hoàn (hoặc mã chứng từ chi tiền)',
    example: 'REF-VCB987654321',
  })
  @IsString({ message: 'Mã chứng từ chi hoàn tiền phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã chứng từ chi hoàn tiền không được để trống' })
  @MaxLength(100, { message: 'Mã chứng từ chi hoàn tiền tối đa 100 ký tự' })
  externalTransactionId!: string;
}
