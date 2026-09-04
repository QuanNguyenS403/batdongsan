import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId dạng string vì BigInt không serialize trực tiếp trong JWT
  phone: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Không còn fallback mặc định — assertRequiredSecrets() trong main.ts (chạy TRƯỚC
      // NestFactory.create(), tức trước khi constructor này được khởi tạo qua DI) đã đảm bảo
      // biến này luôn được thiết lập hợp lệ. Phải dùng CHÍNH XÁC secret giống lúc ký token
      // trong auth.service.ts#issueTokens, nếu không mọi token hợp lệ sẽ bị từ chối.
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
    if (!user || user.isBlocked) return null;
    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
