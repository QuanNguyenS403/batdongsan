import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RaiseDisputeDto {
  @ApiProperty({ description: 'Lý do phản ánh/khiếu nại' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Chi tiết bằng chứng hoặc nội dung phản ánh' })
  @IsOptional()
  @IsString()
  details?: string;
}
