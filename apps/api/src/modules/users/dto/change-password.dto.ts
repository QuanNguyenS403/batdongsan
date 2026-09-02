import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự.' })
  newPassword!: string;
}
