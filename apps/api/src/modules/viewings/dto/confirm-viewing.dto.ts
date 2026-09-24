import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmViewingDto {
  @ApiPropertyOptional({ description: 'ID chuyên viên tư vấn trực tiếp dẫn xem' })
  @IsOptional()
  agentId?: string | number;

  @ApiPropertyOptional({ description: 'Mã xác nhận hoặc ghi chú điểm hẹn' })
  @IsOptional()
  @IsString()
  checkinCode?: string;

  @ApiPropertyOptional({ description: 'Ghi chú cho buổi dẫn xem' })
  @IsOptional()
  @IsString()
  notes?: string;
}
