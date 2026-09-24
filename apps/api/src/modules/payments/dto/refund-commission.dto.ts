import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RefundCommissionDto {
  @ApiProperty({ description: 'Số tiền hoàn lại (VNĐ)' })
  @IsNumber()
  refundAmount!: number;

  @ApiProperty({ description: 'Lý do hoàn phí' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Mã giao dịch ngân hàng chuyển hoàn tiền' })
  @IsOptional()
  @IsString()
  refundBankTxId?: string;
}
