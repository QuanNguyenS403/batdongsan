import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeadStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của lead',
    enum: ['new', 'contacted', 'qualified', 'completed', 'spam', 'cancelled'],
  })
  @IsNotEmpty()
  @IsIn(['new', 'contacted', 'qualified', 'completed', 'spam', 'cancelled'], {
    message: 'Trạng thái không hợp lệ',
  })
  status!: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về tiến độ xử lý lead' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'ID nhân sự phụ trách xử lý lead' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}
