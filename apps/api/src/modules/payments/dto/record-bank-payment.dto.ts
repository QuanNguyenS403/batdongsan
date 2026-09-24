import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordBankPaymentDto {
  @ApiProperty({ description: 'Mã tham chiếu giao dịch ngân hàng duy nhất (FT... / MB...)' })
  @IsString()
  @IsNotEmpty()
  externalBankTxId!: string;

  @ApiProperty({ description: 'Tên ngân hàng tiếp nhận' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ description: 'Số tài khoản nhận tiền' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ description: 'Số tiền thực tế ngân hàng ghi nhận (VNĐ)' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Thời gian phát sinh giao dịch ngân hàng' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paymentTime?: Date;

  @ApiPropertyOptional({ description: 'Nội dung chuyển khoản gốc từ sổ phụ/SMS ngân hàng' })
  @IsOptional()
  @IsString()
  rawDescription?: string;

  @ApiPropertyOptional({ description: 'Tên người chuyển' })
  @IsOptional()
  @IsString()
  remitterName?: string;

  @ApiPropertyOptional({ description: 'Số tài khoản người chuyển' })
  @IsOptional()
  @IsString()
  remitterAccount?: string;
}
