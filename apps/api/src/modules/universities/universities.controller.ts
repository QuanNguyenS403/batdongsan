import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { QueryUniversitiesDto } from './dto/query-universities.dto';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách trường đại học / cao đẳng' })
  findAll(@Query() query: QueryUniversitiesDto) {
    return this.universitiesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một trường đại học theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.universitiesService.findBySlug(slug);
  }
}
