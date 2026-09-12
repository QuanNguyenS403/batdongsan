import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { RejectListingDto } from './dto/reject-listing.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { QueryAdminListingsDto } from './dto/query-admin-listings.dto';
import { QueryAdminReportsDto } from './dto/query-admin-reports.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';

interface AuthUser {
  id: bigint;
  role: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Thống kê tổng quan Dashboard' })
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @ApiOperation({ summary: 'Kích hoạt quét dọn tin quá hạn và OTP thủ công' })
  @Post('tasks/run-sweep')
  runSweep() {
    return this.adminService.runSweep();
  }

  @ApiOperation({ summary: 'Danh sách tin đăng chờ duyệt' })
  @Get('listings/pending')
  getPendingListings(@Query() query: QueryAdminListingsDto) {
    return this.adminService.getPendingListings(query);
  }

  @ApiOperation({ summary: 'Duyệt tin đăng (POST/PATCH)' })
  @Post('listings/:id/approve')
  approveListing(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.adminService.approveListing(id, admin.id);
  }

  @Patch('listings/:id/approve')
  approveListingPatch(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.adminService.approveListing(id, admin.id);
  }

  @ApiOperation({ summary: 'Từ chối tin đăng (POST/PATCH)' })
  @Post('listings/:id/reject')
  rejectListing(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: RejectListingDto,
  ) {
    const finalReason = dto.reason ?? dto.rejectionReason ?? 'Vi phạm quy định kiểm duyệt';
    return this.adminService.rejectListing(id, finalReason, admin.id);
  }

  @Patch('listings/:id/reject')
  rejectListingPatch(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: RejectListingDto,
  ) {
    const finalReason = dto.reason ?? dto.rejectionReason ?? 'Vi phạm quy định kiểm duyệt';
    return this.adminService.rejectListing(id, finalReason, admin.id);
  }

  @ApiOperation({ summary: 'Admin đánh dấu tin đã xác thực thực tế (Giai đoạn 2 Trust-as-a-Service)' })
  @Post('listings/:id/verify')
  verifyListing(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.adminService.verifyListing(id, admin.id);
  }

  @ApiOperation({ summary: 'Admin huỷ nhãn xác thực thực tế' })
  @Post('listings/:id/unverify')
  unverifyListing(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.adminService.unverifyListing(id, admin.id);
  }

  @ApiOperation({ summary: 'Danh sách báo cáo vi phạm' })
  @Get('reports')
  getReports(@Query() query: QueryAdminReportsDto) {
    return this.adminService.getReports(query);
  }

  @ApiOperation({ summary: 'Xử lý báo cáo vi phạm (gỡ tin hoặc bỏ qua)' })
  @Post('reports/:id/resolve')
  resolveReport(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto.action);
  }

  @ApiOperation({ summary: 'Danh sách người dùng' })
  @Get('users')
  getUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminService.getUsers(query);
  }

  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản người dùng' })
  @Post('users/:id/toggle-block')
  toggleBlockUser(@CurrentUser() admin: AuthUser, @Param('id', ParseBigIntPipe) id: bigint) {
    return this.adminService.toggleBlockUser(id, admin.id);
  }
}
