import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelViewingDto {
  @ApiPropertyOptional({ description: 'Lý do hủy lịch xem' })
  @IsOptional()
  @IsString()
  reason?: string;
}
