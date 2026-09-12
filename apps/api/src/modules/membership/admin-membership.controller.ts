import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { MembershipService } from './membership.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { CreatePricingSeasonDto } from './dto/create-pricing-season.dto';
import { UpdatePricingSeasonDto } from './dto/update-pricing-season.dto';

interface AuthUser {
  id: bigint;
  role: string;
}

@ApiTags('admin-membership')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminMembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // ================= QUẢN LÝ GÓI THÀNH VIÊN =================

  @ApiOperation({ summary: 'Admin lấy danh sách tất cả các gói' })
  @Get('membership-plans')
  getAllPlans() {
    return this.membershipService.getAllPlans();
  }

  @ApiOperation({ summary: 'Admin tạo gói mới' })
  @Post('membership-plans')
  createPlan(@Body() dto: CreateMembershipPlanDto) {
    return this.membershipService.createPlan(dto);
  }

  @ApiOperation({ summary: 'Admin cập nhật gói' })
  @Patch('membership-plans/:id')
  updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMembershipPlanDto) {
    return this.membershipService.updatePlan(id, dto);
  }

  @ApiOperation({ summary: 'Admin xóa gói' })
  @Delete('membership-plans/:id')
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.membershipService.deletePlan(id);
  }

  // ================= DUYỆT YÊU CẦU NÂNG CẤP GÓI =================

  @ApiOperation({ summary: 'Admin lấy danh sách yêu cầu nâng cấp gói' })
  @Get('membership-requests')
  getMembershipRequests(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.membershipService.getAdminRequests({ status, page, pageSize });
  }

  @ApiOperation({ summary: 'Admin duyệt yêu cầu nâng cấp gói (Xác nhận chuyển khoản)' })
  @Post('membership-requests/:id/approve')
  approveRequest(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.membershipService.approveRequest(admin.id, id);
  }

  @ApiOperation({ summary: 'Admin từ chối yêu cầu nâng cấp gói' })
  @Post('membership-requests/:id/reject')
  rejectRequest(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body('reason') reason?: string,
  ) {
    return this.membershipService.rejectRequest(id, reason);
  }

  // ================= CẤU HÌNH MÙA CAO ĐIỂM (SURGE PRICING) =================

  @ApiOperation({ summary: 'Admin lấy danh sách các mùa cao điểm' })
  @Get('pricing-seasons')
  getPricingSeasons() {
    return this.membershipService.getPricingSeasons();
  }

  @ApiOperation({ summary: 'Admin tạo cấu hình mùa cao điểm mới' })
  @Post('pricing-seasons')
  createPricingSeason(@Body() dto: CreatePricingSeasonDto) {
    return this.membershipService.createPricingSeason(dto);
  }

  @ApiOperation({ summary: 'Admin cập nhật cấu hình mùa cao điểm' })
  @Patch('pricing-seasons/:id')
  updatePricingSeason(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePricingSeasonDto) {
    return this.membershipService.updatePricingSeason(id, dto);
  }

  @ApiOperation({ summary: 'Admin xóa cấu hình mùa cao điểm' })
  @Delete('pricing-seasons/:id')
  deletePricingSeason(@Param('id', ParseIntPipe) id: number) {
    return this.membershipService.deletePricingSeason(id);
  }
}
