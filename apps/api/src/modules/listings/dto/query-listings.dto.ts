import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryListingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() locationSlug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;

  @ApiPropertyOptional({ description: 'Nhóm chuyên mục: thue_can_ho | thue_studio | thue_tro | thue_mat_bang' })
  @IsOptional()
  @IsString()
  categoryGroup?: string;

  @ApiPropertyOptional({ description: 'Lọc theo slug trường đại học gần đó' })
  @IsOptional()
  @IsString()
  universitySlug?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID trường đại học gần đó' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  universityId?: number;

  @ApiPropertyOptional({ description: 'Danh sách tiện ích cách nhau bởi dấu phẩy (VD: wifi,airConditioner,mezzanine)' })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiPropertyOptional({ description: 'Lọc tin đã bao gồm điện nước (true)' })
  @IsOptional()
  @IsString()
  utilitiesIncluded?: string;

  @ApiPropertyOptional({ description: 'Loại trừ các propertyType, cách nhau bởi dấu phẩy' })
  @IsOptional()
  @IsString()
  excludePropertyTypes?: string;

  @ApiPropertyOptional({ description: 'Giá thuê tối thiểu VNĐ/tháng' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Giá thuê tối đa VNĐ/tháng' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) areaMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) areaMax?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() bedrooms?: number;

  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm theo tiêu đề hoặc địa chỉ' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 20;
}
