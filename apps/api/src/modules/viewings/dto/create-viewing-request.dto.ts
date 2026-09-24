import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateViewingRequestDto {
  @ApiProperty({ description: 'ID phòng cần xem' })
  @IsNotEmpty()
  unitId!: string | number;

  @ApiProperty({ description: 'Tên người xem phòng' })
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @ApiProperty({ description: 'Số điện thoại người xem phòng' })
  @IsPhoneNumber('VN')
  clientPhone!: string;

  @ApiProperty({ description: 'Thời gian bắt đầu mong muốn' })
  @Type(() => Date)
  @IsDate()
  scheduledStartTime!: Date;

  @ApiProperty({ description: 'Thời gian kết thúc mong muốn' })
  @Type(() => Date)
  @IsDate()
  scheduledEndTime!: Date;

  @ApiPropertyOptional({ description: 'Ghi chú nhu cầu hoặc lưu ý đặc biệt' })
  @IsOptional()
  @IsString()
  notes?: string;
}
