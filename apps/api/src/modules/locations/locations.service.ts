import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Trả toàn bộ địa danh dạng phẳng (FE tự dựng dropdown phân cấp qua parentId). */
  async findAll(level?: string) {
    return this.prisma.location.findMany({
      where: level ? { level } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.location.findUnique({ where: { slug }, include: { children: true } });
  }
}
