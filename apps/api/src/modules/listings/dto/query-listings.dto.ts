import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryListingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() locationSlug?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['sale', 'rent']) transactionType?: 'sale' | 'rent';
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMax?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) areaMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) areaMax?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() bedrooms?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() keyword?: string;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize: number = 20;
}
