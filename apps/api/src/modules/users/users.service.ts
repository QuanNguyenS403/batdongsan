import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hồ sơ công khai của người đăng tin — dùng cho trang "môi giới". Không bao giờ trả passwordHash/phone đầy đủ ở đây. */
  async getPublicProfile(id: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, avatarUrl: true, role: true, createdAt: true, isIdVerified: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return { ...user, id: user.id.toString() };
  }
}
