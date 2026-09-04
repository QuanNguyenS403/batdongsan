import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

function serializeUser(user: {
  id: bigint;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  isBlocked?: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id.toString(),
    phone: user.phone,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isBlocked: user.isBlocked ?? false,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async checkPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    return { exists: !!user };
  }

  async sendOtp(phone: string) {
    await this.otpService.sendOtp(phone);
    return { message: 'Đã gửi mã OTP. Ở môi trường dev, xem mã trong log server (SMS_PROVIDER=mock).' };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Số điện thoại đã được đăng ký. Vui lòng đăng nhập.');

    const otpValid = this.otpService.verifyOtp(dto.phone, dto.otpCode);
    if (!otpValid) throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        isPhoneVerified: true,
      },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng.');

    if (user.isBlocked) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa do vi phạm chính sách. Vui lòng liên hệ quản trị viên.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng.');

    return this.issueTokens(user);
  }

  /**
   * Cấp lại access token mới từ refresh token còn hạn — trước đây API có TRẢ refreshToken khi
   * login/register nhưng KHÔNG hề có endpoint nào chấp nhận nó, khiến access token hết hạn sau
   * 15 phút là người dùng bị văng ra phải đăng nhập lại bằng mật khẩu, refreshToken sinh ra vô nghĩa.
   */
  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string; phone: string; role: string };
    try {
      // Không còn fallback "?? 'changeme_refresh'" — assertRequiredSecrets() trong main.ts đã
      // đảm bảo biến này luôn tồn tại và không phải giá trị placeholder trước khi app khởi động,
      // nên ở đây chỉ cần đọc thẳng, tránh mọi khả năng vô tình dùng lại secret đoán trước được.
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET as string,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
    if (!user || user.isBlocked) throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa.');

    return this.issueTokens(user);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại.');

    const otpValid = this.otpService.verifyOtp(dto.phone, dto.otpCode);
    if (!otpValid) throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn.');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async me(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return serializeUser(user);
  }

  private issueTokens(user: { id: bigint; phone: string; fullName: string | null; avatarUrl: string | null; role: string; createdAt: Date }) {
    const payload = { sub: user.id.toString(), phone: user.phone, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    return { accessToken, refreshToken, user: serializeUser(user) };
  }
}

