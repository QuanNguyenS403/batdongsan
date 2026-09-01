import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '0901234567' })
  @IsPhoneNumber('VN')
  phone!: string;

  @ApiProperty()
  @MinLength(6)
  password!: string;
}
