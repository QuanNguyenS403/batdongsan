import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AllocatePaymentDto {
  @ApiProperty({ description: 'ID khoản hoa hồng Commission cần phân bổ tiền' })
  @IsNotEmpty()
  commissionId!: string | number;

  @ApiProperty({ description: 'Số tiền phân bổ (VNĐ)' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Ghi chú đối soát phân bổ' })
  @IsOptional()
  @IsString()
  note?: string;
}
