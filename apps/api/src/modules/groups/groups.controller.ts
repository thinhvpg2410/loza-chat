import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupDetailWrapperOpenApiDto } from '../../common/swagger/group-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GroupLeaveOpenApiDto } from '../../common/swagger/primitive-responses.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { TransferGroupOwnershipDto } from './dto/transfer-group-ownership.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateGroupMemberRoleDto } from './dto/update-group-member-role.dto';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a group conversation (creator becomes owner)',
  })
  @ApiCreatedResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async create(@GetUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Group details and member roster (members only)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async getOne(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    const group = await this.groupsService.getGroupDetailForMember(
      userId,
      conversationId,
    );
    return { group };
  }

  @Post(':id/join-requests')
  @ApiOperation({
    summary:
      'Create a self-service join request (requires joinApprovalRequired; you must be friends with an active member)',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Group conversation id' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { created: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async createJoinRequest(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    return this.groupsService.createSelfJoinRequest(userId, conversationId);
  }

  @Get(':id/join-requests')
  @ApiOperation({
    summary:
      'List pending self-join requests and admin-invited pending members (owner/admin only)',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Group conversation id' })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async listJoinRequests(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    return this.groupsService.listJoinQueue(userId, conversationId);
  }

  @Post(':id/join-requests/:userId/approve')
  @ApiOperation({ summary: 'Approve a pending self-join request (owner/admin)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Group conversation id' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async approveJoinRequest(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) applicantUserId: string,
  ) {
    return this.groupsService.approveJoinRequest(
      userId,
      conversationId,
      applicantUserId,
    );
  }

  @Post(':id/join-requests/:userId/reject')
  @ApiOperation({ summary: 'Reject a pending self-join request (owner/admin)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Group conversation id' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async rejectJoinRequest(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) applicantUserId: string,
  ) {
    return this.groupsService.rejectJoinRequest(
      userId,
      conversationId,
      applicantUserId,
    );
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update group permission settings (owner only)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async updateSettings(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: UpdateGroupSettingsDto,
  ) {
    return this.groupsService.updateGroupSettings(userId, conversationId, dto);
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer group ownership (owner only)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async transferOwnership(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: TransferGroupOwnershipDto,
  ) {
    return this.groupsService.transferOwnership(userId, conversationId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Dissolve the group (owner only; soft — marks dissolved, removes all members; message history retained)',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { dissolved: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async dissolve(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    return this.groupsService.dissolveGroup(userId, conversationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group title and/or avatar' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async update(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(userId, conversationId, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members (owner or admin)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiCreatedResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async addMembers(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: AddGroupMembersDto,
  ) {
    return this.groupsService.addMembers(userId, conversationId, dto);
  }

  @Post(':id/members/:userId/approve')
  @ApiOperation({ summary: 'Approve a pending member (owner or admin)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async approveMember(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
  ) {
    return this.groupsService.approveMember(userId, conversationId, targetUserId);
  }

  @Post(':id/members/:userId/reject')
  @ApiOperation({ summary: 'Reject/remove a pending member (owner or admin)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async rejectMember(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
  ) {
    return this.groupsService.rejectMember(userId, conversationId, targetUserId);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Set member role to admin or member (owner only)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async updateMemberRole(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
    @Body() dto: UpdateGroupMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(
      userId,
      conversationId,
      targetUserId,
      dto,
    );
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member (owner or admin; not yourself)' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiParam({ name: 'userId', format: 'uuid', description: 'Member to remove' })
  @ApiOkResponse({ type: GroupDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async removeMember(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
  ) {
    return this.groupsService.removeMember(
      userId,
      conversationId,
      targetUserId,
    );
  }

  @Post(':id/leave')
  @ApiOperation({
    summary: 'Leave the group (owner transfers ownership if others remain)',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Group conversation id',
  })
  @ApiCreatedResponse({ type: GroupLeaveOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async leave(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    return this.groupsService.leaveGroup(userId, conversationId);
  }
}
