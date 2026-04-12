import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  UsernameAvailableOpenApiDto,
  UserSearchOpenApiDto,
} from '../../common/swagger/friends-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import {
  MeResponseOpenApiDto,
  UserPatchResponseOpenApiDto,
} from '../../common/swagger/public-user-entity.dto';
import { SimpleMessageOpenApiDto } from '../../common/swagger/auth-openapi.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UsernameAvailableQueryDto } from './dto/username-available-query.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
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
  @ApiOkResponse({ type: MeResponseOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  getMe(@GetUser() user: AuthenticatedUser) {
    return { user: this.usersService.getMe(user) };
  }

  @Get('username-available')
  @ApiOperation({
    summary: 'Check if username is free for the current user (edit profile)',
  })
  @ApiOkResponse({ type: UsernameAvailableOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  usernameAvailable(
    @GetUser('id') viewerId: string,
    @Query() query: UsernameAvailableQueryDto,
  ) {
    return this.usersService.isUsernameAvailable(query.username, viewerId);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search by exact phoneNumber (E.164) or exact username',
    description:
      'Provide exactly one query parameter: `phoneNumber` or `username`.',
  })
  @ApiOkResponse({ type: UserSearchOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  search(@GetUser('id') viewerId: string, @Query() query: SearchUsersQueryDto) {
    return this.usersService.searchUsers(
      viewerId,
      query.phoneNumber,
      query.username,
    );
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile fields' })
  @ApiOkResponse({ type: UserPatchResponseOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 409, type: ApiErrorEnvelopeDto })
  async patchMe(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { user };
  }

  @Patch('me/avatar')
  @ApiOperation({
    summary:
      'Set avatar from a completed image upload session (uploads/init → PUT → uploads/complete)',
  })
  @ApiOkResponse({ type: UserPatchResponseOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async patchAvatar(
    @GetUser('id') userId: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.usersService.updateAvatar(userId, dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }
}
