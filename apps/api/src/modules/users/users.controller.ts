import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { ApiResponse } from '../../common/http/api-response.util';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPublicEntity } from './entities/user-public.entity';
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
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update name and/or avatar' })
  updateMe(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserPublicEntity>> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by phone or name (max 10)' })
  search(
    @GetUser('id') userId: string,
    @Query() query: SearchUsersQueryDto,
  ): Promise<ApiResponse<UserPublicEntity[]>> {
    return this.usersService.searchUsers(userId, query.q);
  }
}
