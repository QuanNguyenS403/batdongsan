import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@batdongsan/database';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUniversitiesDto } from './dto/query-universities.dto';

@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUniversitiesDto) {
    const where: Prisma.UniversityWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { abbreviation: { contains: query.keyword, mode: 'insensitive' } },
        { slug: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.locationSlug) {
      where.location = {
        slug: query.locationSlug,
      };
    }

    const items = await this.prisma.university.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        location: { select: { id: true, name: true, slug: true } },
        _count: {
          select: {
            listings: {
              where: {
                listing: {
                  status: 'active',
                },
              },
            },
          },
        },
      },
    });

    return items.map((u) => ({
      id: u.id,
      name: u.name,
      abbreviation: u.abbreviation,
      slug: u.slug,
      address: u.address,
      lat: u.lat,
      lng: u.lng,
      location: u.location,
      activeListingCount: u._count.listings,
    }));
  }

  async findBySlug(slug: string) {
    const university = await this.prisma.university.findUnique({
      where: { slug },
      include: {
        location: { select: { id: true, name: true, slug: true } },
        _count: {
          select: {
            listings: {
              where: {
                listing: {
                  status: 'active',
                },
              },
            },
          },
        },
      },
    });

    if (!university) {
      throw new NotFoundException(`Không tìm thấy trường đại học với slug "${slug}"`);
    }

    return {
      id: university.id,
      name: university.name,
      abbreviation: university.abbreviation,
      slug: university.slug,
      address: university.address,
      lat: university.lat,
      lng: university.lng,
      location: university.location,
      activeListingCount: university._count.listings,
    };
  }
}
