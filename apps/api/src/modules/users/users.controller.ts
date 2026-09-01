import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from '../../common/decorators/public.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':id/public-profile')
  getPublicProfile(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.usersService.getPublicProfile(id);
  }
}

