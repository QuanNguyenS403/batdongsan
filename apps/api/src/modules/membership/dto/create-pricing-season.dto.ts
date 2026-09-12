import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePricingSeasonDto {
  @ApiProperty({ description: 'Tên mùa cao điểm', example: 'Mùa tựu trường (Tháng 8 - Tháng 9)' })
  @IsNotEmpty({ message: 'Tên mùa cao điểm không được để trống' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ description: 'Ngày bắt đầu áp dụng', example: '2026-08-01T00:00:00.000Z' })
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString({}, { message: 'Ngày bắt đầu phải đúng định dạng ngày tháng' })
  startDate!: string;

  @ApiProperty({ description: 'Ngày kết thúc áp dụng', example: '2026-09-30T23:59:59.000Z' })
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString({}, { message: 'Ngày kết thúc phải đúng định dạng ngày tháng' })
  endDate!: string;

  @ApiProperty({ description: 'Hệ số nhân giá (Surge Multiplier)', example: 1.25 })
  @IsNotEmpty({ message: 'Hệ số nhân giá không được để trống' })
  @IsNumber({}, { message: 'Hệ số giá phải là số' })
  @Min(0.5, { message: 'Hệ số tối thiểu là 0.5x' })
  @Max(5.0, { message: 'Hệ số tối đa là 5.0x' })
  priceMultiplier!: number;

  @ApiPropertyOptional({ description: 'Bật/tắt mùa cao điểm', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả thêm', example: 'Nhu cầu tìm phòng trọ của tân sinh viên tăng mạnh' })
  @IsOptional()
  @IsString()
  description?: string;
}
