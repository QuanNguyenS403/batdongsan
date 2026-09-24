import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID phòng cần giữ' })
  @IsNotEmpty()
  unitId!: string | number;

  @ApiPropertyOptional({ description: 'ID hợp đồng giao dịch thuê nếu đã có' })
  @IsOptional()
  dealId?: string | number;

  @ApiProperty({ description: 'Thời điểm bắt đầu giữ phòng' })
  @Type(() => Date)
  @IsDate()
  reservedFrom!: Date;

  @ApiProperty({ description: 'Thời điểm kết thúc giữ phòng' })
  @Type(() => Date)
  @IsDate()
  reservedUntil!: Date;

  @ApiPropertyOptional({ description: 'Lý do giữ phòng', default: 'viewing_interest' })
  @IsOptional()
  @IsString()
  holdReason?: string;
}
