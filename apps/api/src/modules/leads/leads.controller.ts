import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { AdminCapability, RequireCapabilities } from '../../common/decorators/capabilities.decorator';

interface AuthUser {
  id: bigint;
  role: string;
}

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @ApiOperation({ summary: 'Gửi yêu cầu liên hệ / để lại thông tin (Khách thuê)' })
  @Post()
  createLead(@Body() dto: CreateLeadDto, @Req() req: any) {
    const requesterId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.leadsService.createLead(dto, requesterId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem danh sách khách thuê quan tâm tới tin của tôi (Chủ tin)' })
  @Get('mine')
  findMyLeads(@CurrentUser() user: AuthUser, @Query() query: QueryLeadsDto) {
    return this.leadsService.findMyLeads(user.id, query);
  }

  @ApiBearerAuth()
  @Roles('admin')
  @RequireCapabilities(AdminCapability.LEADS_SUPPORT)
  @ApiOperation({ summary: 'Admin quản lý toàn bộ lead queue của sàn' })
  @Get('admin')
  findAdminLeads(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAdminLeads(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái lead (Chủ tin hoặc Admin)' })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    const isAdmin = user.role === 'admin';
    return this.leadsService.updateStatus(id, dto, user.id, isAdmin);
  }
}
