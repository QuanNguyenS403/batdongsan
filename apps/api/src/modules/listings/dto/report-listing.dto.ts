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
  'da_het_phong',
  'already_rented',
  'gia_thuc_te_khac',
  'price_mismatch',
  'khong_phai_chinh_chu',
  'not_authorized',
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
