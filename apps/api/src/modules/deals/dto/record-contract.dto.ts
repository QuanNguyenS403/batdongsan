import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class RecordContractDto {
  @ApiPropertyOptional({ description: 'Ngày ký hợp đồng thuê' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  contractSignedAt?: Date;

  @ApiPropertyOptional({ description: 'Link scan/ảnh hợp đồng thuê đã ký' })
  @IsOptional()
  @IsString()
  contractUrl?: string;

  @ApiPropertyOptional({ description: 'Mã băm SHA-256 của file hợp đồng' })
  @IsOptional()
  @IsString()
  contractHash?: string;
}
