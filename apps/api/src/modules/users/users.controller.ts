import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  getMe(@GetUser() user: User) {
    return { user: this.usersService.getMe(user) };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search by exact phoneNumber (E.164) or exact username',
  })
  search(@GetUser('id') viewerId: string, @Query() query: SearchUsersQueryDto) {
    return this.usersService.searchUsers(
      viewerId,
      query.phoneNumber,
      query.username,
    );
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile fields' })
  async patchMe(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { user };
  }
}
