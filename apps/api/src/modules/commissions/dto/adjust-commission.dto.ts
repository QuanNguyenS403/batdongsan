import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustCommissionDto {
  @ApiProperty({ description: 'Cơ sở tính phí mới (VNĐ)' })
  @IsNumber()
  newBaseVnd!: number;

  @ApiProperty({ description: 'Lý do điều chỉnh (lưu vết bất biến)' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Tỷ lệ mới theo basis points nếu có thay đổi', default: 4000 })
  @IsOptional()
  @IsNumber()
  rateBps?: number;
}
