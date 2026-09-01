import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthUser {
  id: bigint;
  role: string;
}

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findAll(query);
  }

  @Public()
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.listingsService.findOne(idOrSlug);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Put(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(BigInt(id), user, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.listingsService.remove(BigInt(id), user);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 20))
  async addImages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const urls = await this.uploadsService.saveListingImages(id.toString(), files);
    return this.listingsService.addImages(BigInt(id), user, urls);
  }

  @ApiBearerAuth()
  @Post(':id/reveal-phone')
  revealPhone(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.listingsService.revealPhone(BigInt(id), user.id);
  }

  @Public()
  @Post(':id/report')
  report(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @Body('note') note?: string,
  ) {
    return this.listingsService.report(BigInt(id), reason, note);
  }
}
