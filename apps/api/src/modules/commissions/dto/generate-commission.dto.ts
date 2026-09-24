import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GenerateCommissionDto {
  @ApiPropertyOptional({
    description: 'Cơ sở tính phí tùy chỉnh (VNĐ) nếu có ưu đãi/thỏa thuận kỳ 1 tháng đầu khác giá hợp đồng',
  })
  @IsOptional()
  @IsNumber()
  customBaseVnd?: number;
}
