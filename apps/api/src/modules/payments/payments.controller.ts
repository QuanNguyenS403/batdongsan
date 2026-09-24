import {
  Body,
  Controller,
  Get,
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

@ApiTags('Payments & Reconciliation')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bank-transactions')
  @Roles('admin')
  @ApiOperation({ summary: 'Nhập giao dịch ngân hàng thực tế để đối soát' })
  async recordBankPayment(@Body() dto: RecordBankPaymentDto, @Request() req: any) {
    return this.paymentsService.recordBankPayment(dto, req.user.id);
  }

  @Post(':id/allocate')
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
  @Roles('admin')
  @ApiOperation({ summary: 'Xem chi tiết giao dịch ngân hàng và phân bổ' })
  async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}
