import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@batdongsan/database';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateListingDto {
  @ApiPropertyOptional({ enum: TransactionType, default: TransactionType.rent })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType = TransactionType.rent;

  @ApiProperty({ example: 'phong-tro-sinh-vien', description: 'phong-tro-sinh-vien | phong-tro-nguoi-di-lam | can-ho-chung-cu | nha-nguyen-can | studio | mat-bang-kinh-doanh | ky-tuc-xa-tu-nhan' })
  @IsString()
  propertyType!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  locationId!: number;

  @ApiPropertyOptional({ description: 'Mã khu trọ / chung cư mini (RentalCompound/Project)' })
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

  @ApiProperty({ example: 3500000, description: 'Giá thuê hàng tháng (VNĐ/tháng)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 3500000, description: 'Tiền cọc yêu cầu (VNĐ)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ example: 6, description: 'Thời hạn hợp đồng tối thiểu (tháng)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minLeaseMonths?: number;

  @ApiPropertyOptional({ example: false, description: 'Giá thuê đã bao gồm điện nước chưa' })
  @IsOptional()
  @IsBoolean()
  utilitiesIncluded?: boolean;

  @ApiPropertyOptional({ example: 3500, description: 'Đơn giá điện (đ/kWh)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  electricityPricePerKwh?: number;

  @ApiPropertyOptional({ example: 18000, description: 'Đơn giá nước (đ/m3)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  waterPricePerM3?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Giá nước khoán theo đầu người hoặc theo tháng (đ)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  waterPriceFlat?: number;

  @ApiPropertyOptional({ description: 'Tiện ích có sẵn dạng JSON object (wifi, airConditioner, mezzanine...)' })
  @IsOptional()
  amenities?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Danh sách ID các trường đại học lân cận', type: [Number] })
  @IsOptional()
  @IsArray()
  nearbyUniversityIds?: number[];

  @ApiPropertyOptional({
    description: 'Chi tiết khoảng cách các trường ĐH',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        universityId: { type: 'number' },
        distanceMeters: { type: 'number' },
        travelTimeMinutes: { type: 'number' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  universityDistances?: { universityId: number; distanceMeters?: number; travelTimeMinutes?: number }[];

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  areaM2!: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(50) bedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(50) bathrooms?: number;

  @ApiPropertyOptional({ example: 'hop_dong_6_thang', description: 'hop_dong_6_thang | hop_dong_1_nam | linh_hoat | khong_can_hop_dong' })
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
