import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@batdongsan/database';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @ApiProperty({ example: 'can-ho', description: 'nha | can-ho | dat | shophouse | phong-tro | van-phong...' })
  @IsString()
  propertyType!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  locationId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  projectId?: number;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'Tiêu đề nên tối thiểu 10 ký tự để mô tả rõ tin đăng.' })
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3500000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 72.5 })
  @IsNumber()
  @Min(0)
  areaM2!: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(50) bedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(50) bathrooms?: number;

  @ApiPropertyOptional({ example: 'so_hong', description: 'so_do | so_hong | hop_dong | dang_cho_so' })
  @IsOptional()
  @IsString()
  legalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;
}
