import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { RecordDepositDto } from './dto/record-deposit.dto';
import { RecordContractDto } from './dto/record-contract.dto';
import { RecordHandoverDto } from './dto/record-handover.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Rental Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Khởi tạo hồ sơ giao dịch thuê' })
  async createDeal(@Body() dto: CreateDealDto) {
    return this.dealsService.createDeal(dto);
  }

  @Post(':id/deposit')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Ghi nhận đặt cọc khách - chủ (Không sinh phí hoa hồng)' })
  async recordDeposit(
    @Param('id') id: string,
    @Body() dto: RecordDepositDto
  ) {
    return this.dealsService.recordDeposit(id, dto);
  }

  @Patch(':id/contract')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Ghi nhận ký hợp đồng thuê' })
  async recordContractSigned(
    @Param('id') id: string,
    @Body() dto: RecordContractDto
  ) {
    return this.dealsService.recordContractSigned(id, dto);
  }

  @Patch(':id/first-month-paid')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Ghi nhận chủ đã nhận tiền thuê tháng đầu' })
  async recordFirstMonthPaid(@Param('id') id: string) {
    return this.dealsService.recordFirstMonthPaid(id);
  }

  @Post(':id/handover')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Ghi nhận biên bản bàn giao phòng' })
  async recordHandover(
    @Param('id') id: string,
    @Body() dto: RecordHandoverDto
  ) {
    return this.dealsService.recordHandover(id, dto);
  }

  @Post(':id/evaluate-success')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Đánh giá điều kiện thành công §6.2 để ghi nhận hoa hồng' })
  async evaluateDealSuccess(@Param('id') id: string) {
    return this.dealsService.evaluateDealSuccess(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết hồ sơ giao dịch thuê' })
  async getDealById(@Param('id') id: string) {
    return this.dealsService.getDealById(id);
  }
}
