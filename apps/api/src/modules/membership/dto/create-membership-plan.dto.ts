import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMembershipPlanDto {
  @ApiProperty({ description: 'Tên gói thành viên', example: 'Gói Chủ Trọ Chuyên Nghiệp' })
  @IsNotEmpty({ message: 'Tên gói không được để trống' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Mã định danh duy nhất', example: 'pro' })
  @IsNotEmpty({ message: 'Mã code không được để trống' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết gói', example: 'Dành cho chủ trọ có 10-30 phòng' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Giá gốc niêm yết (VNĐ)', example: 499000 })
  @IsNotEmpty({ message: 'Giá gói không được để trống' })
  @IsInt()
  @Min(0, { message: 'Giá gói không được âm' })
  price!: number;

  @ApiPropertyOptional({ description: 'Thời hạn hiệu lực (ngày)', example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ description: 'Số tin đăng hiển thị đồng thời tối đa', example: 30 })
  @IsNotEmpty({ message: 'Số tin tối đa không được để trống' })
  @IsInt()
  @Min(1, { message: 'Số tin tối đa tối thiểu là 1' })
  maxActiveListings!: number;

  @ApiPropertyOptional({ description: 'Phạm vi khu vực', example: 'Toàn quốc', default: 'Toàn quốc' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regionScope?: string;

  @ApiPropertyOptional({ description: 'Gói nổi bật khuyên dùng', example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp hiển thị', example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
