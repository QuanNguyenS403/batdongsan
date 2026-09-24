import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ApproveMembershipRequestDto {
  @ApiProperty({
    description: 'Mã tham chiếu giao dịch ngân hàng thực tế (FT/Ref code) hoặc mã chứng từ sao kê',
    example: 'VCB1234567890',
  })
  @IsString({ message: 'Mã giao dịch ngân hàng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã giao dịch ngân hàng không được để trống' })
  @MaxLength(100, { message: 'Mã giao dịch ngân hàng tối đa 100 ký tự' })
  externalTransactionId!: string;

  @ApiProperty({
    description: 'Số tiền thực nhận vào tài khoản (VNĐ, số nguyên dương)',
    example: 199000,
  })
  @IsInt({ message: 'Số tiền thực nhận phải là số nguyên' })
  @Min(1, { message: 'Số tiền thực nhận phải lớn hơn 0' })
  confirmedAmount!: number;

  @ApiPropertyOptional({
    description: 'Ghi chú của quản trị viên kế toán',
    example: 'Đã khớp sao kê tài khoản VCB lúc 14:30',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  adminNote?: string;
}
