import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const REPORT_REASONS = [
  'tin_gia',
  'lua_dao',
  'sai_thong_tin',
  'da_ban_cho_thue',
  'khac',
  'spam',
  'wrong_info',
  'sold',
  'fraud',
  'other',
] as const;

export class ReportListingDto {
  @ApiProperty({ enum: REPORT_REASONS })
  @IsIn(REPORT_REASONS, { message: `reason phải là một trong: ${REPORT_REASONS.join(', ')}` })
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
