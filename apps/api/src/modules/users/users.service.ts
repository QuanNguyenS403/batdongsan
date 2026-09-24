import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hồ sơ công khai của người đăng tin — dùng cho trang "môi giới". Không bao giờ trả passwordHash/phone đầy đủ ở đây. */
  async getPublicProfile(id: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, avatarUrl: true, role: true, createdAt: true, isIdVerified: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return { ...user, id: user.id.toString() };
  }

  /** Cập nhật thông tin tài khoản (fullName, avatarUrl) */
  async updateProfile(id: bigint, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName : undefined,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : undefined,
      },
      select: { id: true, phone: true, fullName: true, avatarUrl: true, role: true, createdAt: true },
    });

    return { ...updated, id: updated.id.toString() };
  }

  /** Đổi mật khẩu cho người dùng đang đăng nhập */
  async changePassword(id: bigint, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    // RB-01 & BE-02: Tăng tokenVersion để lập tức thu hồi mọi JWT token cũ của user
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
