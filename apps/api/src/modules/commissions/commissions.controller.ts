import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { AdjustCommissionDto } from './dto/adjust-commission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Commissions')
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Post('deal/:dealId')
  @Roles('broker', 'admin')
  @ApiOperation({ summary: 'Tạo phí hoa hồng 40% cho giao dịch thành công (Chống tạo trùng AT-18)' })
  async generateCommission(
    @Param('dealId') dealId: string,
    @Body() dto: GenerateCommissionDto
  ) {
    return this.commissionsService.generateCommission(dealId, dto);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Mở hồ sơ tranh chấp phí dịch vụ' })
  async raiseDispute(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RaiseDisputeDto
  ) {
    return this.commissionsService.raiseDispute(id, req.user.id, dto);
  }

  @Patch(':id/adjust')
  @Roles('admin')
  @ApiOperation({ summary: 'Điều chỉnh số tiền phí (Audit version bất biến)' })
  async adjustCommission(
    @Param('id') id: string,
    @Body() dto: AdjustCommissionDto
  ) {
    return this.commissionsService.adjustCommission(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết khoản hoa hồng' })
  async getCommissionById(@Param('id') id: string) {
    return this.commissionsService.getCommissionById(id);
  }
}
