import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ResolveReportDto {
  @ApiProperty({
    description: 'Hành động xử lý báo cáo: remove_listing (gỡ tin vi phạm) hoặc dismiss (bỏ qua báo cáo)',
    enum: ['remove_listing', 'dismiss'],
  })
  @IsIn(['remove_listing', 'dismiss'], {
    message: 'action phải là remove_listing hoặc dismiss',
  })
  action!: 'remove_listing' | 'dismiss';
}
