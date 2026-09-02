import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ListingStatus } from '@batdongsan/database';

const ALL_STATUSES = Object.values(ListingStatus);

export class QueryMyListingsDto {
  @ApiPropertyOptional({ enum: ALL_STATUSES, description: 'Lọc theo trạng thái — bỏ trống để lấy mọi trạng thái' })
  @IsOptional()
  @IsIn(ALL_STATUSES)
  status?: ListingStatus;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize: number = 20;
}
