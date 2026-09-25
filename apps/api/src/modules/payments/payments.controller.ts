import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordBankPaymentDto } from './dto/record-bank-payment.dto';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { RefundCommissionDto } from './dto/refund-commission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Receivables & Offline Collections')
@Controller(['payments', 'receivables'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('commissions/:id/vietqr')
  @ApiOperation({ summary: 'Chức năng VietQR thanh toán trực tuyến đã bị gỡ bỏ (PAY-01)' })
  async getVietQr(@Param('id') _id: string) {
    throw new NotFoundException('Chức năng VietQR thanh toán trực tuyến đã bị vô hiệu hóa hoàn toàn theo Kế hoạch V2 (PAY-01)');
  }

  // Alias method phục vụ kiểm thử và tương thích ngược
  async getVietQrForCommission(_id: string | bigint) {
    return this.getVietQr(String(_id));
  }

  @Public()
  @Post('webhook/bank')
  @ApiOperation({ summary: 'Webhook ngân hàng tự động đã bị gỡ bỏ (PAY-01)' })
  async handleBankWebhook() {
    throw new NotFoundException('Webhook ngân hàng tự động đã bị vô hiệu hóa hoàn toàn theo Kế hoạch V2 (PAY-01)');
  }

  // Alias method phục vụ kiểm thử và tương thích ngược
  async handleBankEmailWebhook(_dto?: any) {
    return this.handleBankWebhook();
  }

  @Post('bank-transactions')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Nhập giao dịch ngân hàng thực tế để đối soát' })
  async recordBankPayment(@Body() dto: RecordBankPaymentDto, @Request() req: any) {
    return this.paymentsService.recordBankPayment(dto, req.user.id);
  }

  @Post(':id/allocate')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Đối soát và phân bổ tiền vào phí hoa hồng (BR-11)' })
  async allocatePayment(
    @Param('id') id: string,
    @Body() dto: AllocatePaymentDto,
    @Request() req: any
  ) {
    return this.paymentsService.allocatePayment(id, dto, req.user.id);
  }

  @Post('commissions/:id/refund')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Hoàn phí hoa hồng và ghi bút toán sổ cái' })
  async refundCommission(
    @Param('id') id: string,
    @Body() dto: RefundCommissionDto,
    @Request() req: any
  ) {
    return this.paymentsService.refundCommission(id, dto, req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Xem chi tiết giao dịch ngân hàng và phân bổ' })
  async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}

