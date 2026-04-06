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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a group conversation (creator becomes owner)' })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Group details and member roster (members only)' })
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update group title and/or avatar' })
  async update(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(userId, conversationId, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members (owner or admin)' })
  async addMembers(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: AddGroupMembersDto,
  ) {
    return this.groupsService.addMembers(userId, conversationId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member (owner or admin; not yourself)' })
  async removeMember(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
  ) {
    return this.groupsService.removeMember(userId, conversationId, targetUserId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave the group (owner transfers ownership if others remain)' })
  async leave(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    return this.groupsService.leaveGroup(userId, conversationId);
  }
}
