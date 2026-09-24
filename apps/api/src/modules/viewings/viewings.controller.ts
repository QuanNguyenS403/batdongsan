import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ViewingsService } from './viewings.service';
import { CreateViewingRequestDto } from './dto/create-viewing-request.dto';
import { ConfirmViewingDto } from './dto/confirm-viewing.dto';
import { RescheduleViewingDto } from './dto/reschedule-viewing.dto';
import { CancelViewingDto } from './dto/cancel-viewing.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Viewings')
@Controller('viewings')
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Public()
  @Post('request')
  @ApiOperation({ summary: 'Khách đề xuất lịch xem phòng' })
  async requestViewing(@Body() dto: CreateViewingRequestDto) {
    return this.viewingsService.requestViewing(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('broker', 'admin')
  @ApiBearerAuth()
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận lịch xem phòng (Chống trùng giờ dẫn)' })
  async confirmViewing(@Param('id') id: string, @Body() dto: ConfirmViewingDto) {
    return this.viewingsService.confirmViewing(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Đổi giờ lịch xem phòng' })
  async rescheduleViewing(
    @Param('id') id: string,
    @Body() dto: RescheduleViewingDto
  ) {
    return this.viewingsService.rescheduleViewing(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy lịch xem phòng' })
  async cancelViewing(@Param('id') id: string, @Body() dto: CancelViewingDto) {
    return this.viewingsService.cancelViewing(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('broker', 'admin')
  @ApiBearerAuth()
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Hoàn tất buổi xem phòng' })
  async completeViewing(
    @Param('id') id: string,
    @Body('feedback') feedback?: string
  ) {
    return this.viewingsService.completeViewing(id, feedback);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('broker', 'admin')
  @ApiBearerAuth()
  @Post('reservations')
  @ApiOperation({ summary: 'Giữ chỗ phòng (Chống trùng phòng)' })
  async reserveUnit(@Body() dto: CreateReservationDto) {
    return this.viewingsService.reserveUnit(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('broker', 'admin')
  @ApiBearerAuth()
  @Patch('reservations/:id/cancel')
  @ApiOperation({ summary: 'Hủy giữ chỗ phòng' })
  async cancelReservation(@Param('id') id: string) {
    return this.viewingsService.cancelReservation(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('broker', 'admin')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Danh sách lịch xem phòng' })
  async getViewings(
    @Query('agentId') agentId?: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string
  ) {
    return this.viewingsService.getViewings({
      agentId: agentId ? BigInt(agentId) : undefined,
      unitId: unitId ? BigInt(unitId) : undefined,
      status,
    });
  }
}
