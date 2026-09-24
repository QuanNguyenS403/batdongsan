import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ description: 'ID phòng cho thuê' })
  @IsNotEmpty()
  unitId!: string | number;

  @ApiProperty({ description: 'ID hợp đồng dịch vụ HĐ-01 với chủ' })
  @IsNotEmpty()
  agreementId!: string | number;

  @ApiPropertyOptional({ description: 'ID mã giới thiệu khách Introduction nếu có' })
  @IsOptional()
  introId?: string | number;

  @ApiProperty({ description: 'Tên người thuê' })
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @ApiProperty({ description: 'Số điện thoại người thuê' })
  @IsPhoneNumber('VN')
  tenantPhone!: string;

  @ApiPropertyOptional({ description: 'Số CCCD người thuê' })
  @IsOptional()
  @IsString()
  tenantIdentity?: string;

  @ApiProperty({ description: 'Tiền thuê hàng tháng thực tế chốt (VNĐ)' })
  @IsNumber()
  actualMonthlyRent!: number;

  @ApiPropertyOptional({ description: 'Tiền cọc đã thỏa thuận (VNĐ)', default: 0 })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiProperty({ description: 'Ngày bắt đầu hợp đồng thuê' })
  @Type(() => Date)
  @IsDate()
  leaseStartDate!: Date;

  @ApiProperty({ description: 'Ngày kết thúc hợp đồng thuê' })
  @Type(() => Date)
  @IsDate()
  leaseEndDate!: Date;
}
