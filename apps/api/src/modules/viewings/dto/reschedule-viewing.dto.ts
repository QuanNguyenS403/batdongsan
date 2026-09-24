import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleViewingDto {
  @ApiProperty({ description: 'Thời gian bắt đầu mới' })
  @Type(() => Date)
  @IsDate()
  newStartTime!: Date;

  @ApiProperty({ description: 'Thời gian kết thúc mới' })
  @Type(() => Date)
  @IsDate()
  newEndTime!: Date;

  @ApiPropertyOptional({ description: 'Lý do đổi lịch' })
  @IsOptional()
  @IsString()
  reason?: string;
}
