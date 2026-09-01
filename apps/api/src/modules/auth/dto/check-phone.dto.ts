import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class CheckPhoneDto {
  @ApiProperty({ example: '0901234567' })
  @IsPhoneNumber('VN')
  phone!: string;
}
