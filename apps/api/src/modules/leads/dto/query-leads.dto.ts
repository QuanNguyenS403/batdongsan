import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryLeadsDto {
  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng lead mỗi trang (tối đa 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái lead',
    enum: ['new', 'contacted', 'qualified', 'completed', 'spam', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['new', 'contacted', 'qualified', 'completed', 'spam', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID tin đăng cụ thể' })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên hoặc SĐT người thuê' })
  @IsOptional()
  @IsString()
  search?: string;
}
