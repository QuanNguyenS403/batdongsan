import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID Token / Credential từ Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  credential!: string;
}
