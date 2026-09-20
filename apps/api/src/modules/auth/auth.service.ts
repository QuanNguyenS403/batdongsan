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
    const code = await this.otpService.sendOtp(phone);
    const isDev = process.env.SMS_PROVIDER === 'mock' || !process.env.SMS_PROVIDER || process.env.NODE_ENV !== 'production';
    return {
      message: 'Đã gửi mã xác thực SMS.',
      ...(isDev ? { devOtp: code } : {}),
    };
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
   * Khởi tạo hoặc cập nhật tài khoản quản trị viên thông qua secret bảo mật ngoài repo.
   * Yêu cầu biến môi trường ADMIN_BOOTSTRAP_SECRET được cấu hình và có độ dài tối thiểu 16 ký tự.
   */
  async bootstrapAdmin(dto: { secret: string; phone: string; password: string; fullName?: string }) {
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!configuredSecret || configuredSecret.trim().length < 16) {
      throw new BadRequestException('Chức năng bootstrap admin chưa được cấu hình hoặc đã bị vô hiệu hóa.');
    }
    if (dto.secret !== configuredSecret) {
      throw new UnauthorizedException('Secret bootstrap không chính xác.');
    }

    const existingAdminCount = await this.prisma.user.count({ where: { role: 'admin' } });
    if (existingAdminCount > 0) {
      await this.prisma.auditEvent.create({
        data: {
          actorId: null,
          action: 'auth.bootstrap_admin_rejected',
          entityType: 'system',
          entityId: '0',
          reason: `Từ chối bootstrap admin cho số ${dto.phone} vì hệ thống đã có ${existingAdminCount} tài khoản quản trị viên.`,
        },
      });
      throw new BadRequestException(
        'Hệ thống đã tồn tại tài khoản Quản trị viên. Chức năng bootstrap chỉ được thực hiện một lần duy nhất (one-shot). Vui lòng đăng nhập bằng tài khoản quản trị hiện có.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    let adminUser;
    if (!existing) {
      adminUser = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          fullName: dto.fullName || 'Quản trị viên',
          passwordHash,
          role: 'admin',
          isPhoneVerified: true,
          tokenVersion: 1,
        },
      });
    } else {
      adminUser = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'admin',
          passwordHash,
          tokenVersion: { increment: 1 },
          ...(dto.fullName ? { fullName: dto.fullName } : {}),
        },
      });
    }

    // RB-04: Ghi nhận sự kiện bootstrap vào bảng AuditEvent bất biến
    await this.prisma.auditEvent.create({
      data: {
        actorId: adminUser.id,
        action: 'auth.bootstrap_admin',
        entityType: 'user',
        entityId: adminUser.id.toString(),
        beforeState: { role: existing ? existing.role : null },
        afterState: { role: 'admin' },
        reason: 'Bootstrap tài khoản quản trị viên khởi tạo ban đầu (one-shot)',
      },
    });

    return {
      message: 'Bootstrap tài khoản quản trị viên thành công.',
      user: serializeUser(adminUser),
    };
  }

  /**
   * Cấp lại access token mới từ refresh token còn hạn — trước đây API có TRẢ refreshToken khi
   * login/register nhưng KHÔNG hề có endpoint nào chấp nhận nó, khiến access token hết hạn sau
   * 15 phút là người dùng bị văng ra phải đăng nhập lại bằng mật khẩu, refreshToken sinh ra vô nghĩa.
   */
  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string; phone: string; role: string; tokenVersion?: number };
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

    // RB-01 & BE-02: Bắt buộc tokenVersion phải có và khớp chính xác phiên hiện tại
    if (payload.tokenVersion === undefined || payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi hoặc mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.');
    }

    return this.issueTokens(user);
  }

  async logout(userId: bigint) {
    // BE-02: Tăng tokenVersion để hủy lập tức toàn bộ phiên JWT (cả access token và refresh token)
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Đăng xuất thành công, toàn bộ phiên làm việc đã được thu hồi.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại.');

    const otpValid = this.otpService.verifyOtp(dto.phone, dto.otpCode);
    if (!otpValid) throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn.');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    // BE-02: Đổi mật khẩu đồng thời tăng tokenVersion để cắt đứt mọi session cũ
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async me(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return serializeUser(user);
  }

  private issueTokens(user: { id: bigint; phone: string; fullName: string | null; avatarUrl: string | null; role: string; createdAt: Date; tokenVersion?: number }) {
    const payload = {
      sub: user.id.toString(),
      phone: user.phone,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

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

