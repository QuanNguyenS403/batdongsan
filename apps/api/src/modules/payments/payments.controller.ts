import {
  Body,
  Controller,
  Get,
  Headers,
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

@ApiTags('Payments & Reconciliation')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('commissions/:id/vietqr')
  @ApiOperation({ summary: 'Lấy mã VietQR động chuẩn Napas247 cho khoản phí hoa hồng' })
  async getVietQr(@Param('id') id: string) {
    return this.paymentsService.getVietQrForCommission(id);
  }


  @Public()
  @Post('webhook/bank')
  @ApiOperation({ summary: 'Webhook tự động nhận thông báo biến động số dư từ Email/App ngân hàng miễn phí' })
  async handleBankWebhook(
    @Body() payload: any,
    @Headers('x-webhook-secret') secretHeader?: string,
  ) {
    return this.paymentsService.handleBankEmailWebhook(payload, secretHeader);
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

