import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestMembershipDto } from './dto/request-membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthUser {
  id: bigint;
  phone: string;
}

@ApiTags('memberships')
@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @ApiOperation({ summary: 'Lấy danh sách các gói dịch vụ công khai kèm Surge Pricing' })
  @Get('plans')
  getPublicPlans() {
    return this.membershipService.getPublicPlans();
  }

  @ApiOperation({ summary: 'Lấy thông tin gói hiện tại của người dùng đăng nhập' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-membership')
  getMyMembership(@CurrentUser() user: AuthUser) {
    return this.membershipService.getUserMembershipInfo(user.id);
  }

  @ApiOperation({ summary: 'Gửi yêu cầu nâng cấp / mua gói thành viên' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('request')
  requestUpgrade(@CurrentUser() user: AuthUser, @Body() dto: RequestMembershipDto) {
    return this.membershipService.requestUpgrade(user.id, dto);
  }
}
