import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryUniversitiesDto {
  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm theo tên hoặc viết tắt' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Lọc theo slug địa danh (VD: ho-chi-minh, ha-noi)' })
  @IsOptional()
  @IsString()
  locationSlug?: string;
}
