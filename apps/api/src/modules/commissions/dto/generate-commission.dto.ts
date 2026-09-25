import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GenerateCommissionDto {
  @ApiPropertyOptional({
    description: 'Cơ sở tính phí theo thỏa thuận phụ lục hợp đồng đã có căn cứ xác nhận (VNĐ)',
  })
  @IsOptional()
  @IsNumber()
  customBaseVnd?: number;
}
