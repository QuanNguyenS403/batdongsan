import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordDepositDto {
  @ApiProperty({ description: 'Số tiền đặt cọc (VNĐ)' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Tên người nhận cọc (Chủ nhà hoặc người được ủy quyền)' })
  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @ApiPropertyOptional({ description: 'Số tài khoản nhận cọc' })
  @IsOptional()
  @IsString()
  recipientAccount?: string;

  @ApiPropertyOptional({ description: 'Ngân hàng nhận cọc' })
  @IsOptional()
  @IsString()
  recipientBank?: string;

  @ApiPropertyOptional({ description: 'Ngày chuyển cọc', default: 'Hôm nay' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  depositedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời hạn giữ chỗ theo thỏa thuận cọc' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  holdUntil?: Date;

  @ApiPropertyOptional({ description: 'Link ảnh hoặc chứng từ biên nhận cọc' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thỏa thuận cọc' })
  @IsOptional()
  @IsString()
  notes?: string;
}
