import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordHandoverDto {
  @ApiPropertyOptional({ description: 'Ngày bàn giao phòng thực tế' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  handoverDate?: Date;

  @ApiPropertyOptional({ description: 'Chỉ số công tơ điện lúc bàn giao' })
  @IsOptional()
  @IsNumber()
  electricMeterNumber?: number;

  @ApiPropertyOptional({ description: 'Chỉ số công tơ nước lúc bàn giao' })
  @IsOptional()
  @IsNumber()
  waterMeterNumber?: number;

  @ApiPropertyOptional({ description: 'Số lượng chìa khóa đã bàn giao', default: 1 })
  @IsOptional()
  @IsNumber()
  keysCount?: number;

  @ApiPropertyOptional({ description: 'Ghi chú hiện trạng bàn giao phòng' })
  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @ApiPropertyOptional({ description: 'Link biên bản bàn giao có chữ ký' })
  @IsOptional()
  @IsString()
  handoverDocUrl?: string;

  @ApiPropertyOptional({ description: 'Xác nhận của chủ nhà', default: true })
  @IsOptional()
  @IsBoolean()
  ownerConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Xác nhận của người thuê', default: true })
  @IsOptional()
  @IsBoolean()
  tenantConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Chuyên viên môi giới chứng kiến', default: true })
  @IsOptional()
  @IsBoolean()
  agentWitnessed?: boolean;
}
