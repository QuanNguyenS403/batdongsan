import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } }) // bảo vệ chống brute force bootstrap secret
  @Post('bootstrap-admin')
  bootstrapAdmin(@Body() dto: BootstrapAdminDto) {
    return this.authService.bootstrapAdmin(dto);
  }

  @Public()
  @Get('check-phone')
  checkPhone(@Query() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto.phone);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } }) // tối đa 5 lần gửi OTP/giờ mỗi IP — chặn thêm 1 lớp ngoài rate-limit theo SĐT đã có sẵn trong OtpService
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // chặn brute-force mật khẩu
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('google')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('forgot-password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(@CurrentUser() user: { id: bigint }) {
    return this.authService.logout(user.id);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: { id: bigint }) {
    return this.authService.me(user.id);
  }

  @ApiBearerAuth()
  @Get('broker-terms-status')
  getBrokerTermsStatus(@CurrentUser() user: { id: bigint }) {
    return this.authService.getBrokerTermsStatus(user.id);
  }

  @ApiBearerAuth()
  @Post('accept-broker-terms')
  acceptBrokerTerms(@CurrentUser() user: { id: bigint }, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.acceptBrokerTerms(user.id, ipAddress, userAgent);
  }
}

