import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendRequestActionDto } from './dto/friend-request-action.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendsPaginationQueryDto } from './dto/friends-pagination-query.dto';
import { FriendsService } from './friends.service';

@ApiTags('friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  sendRequest(@GetUser('id') userId: string, @Body() dto: FriendRequestDto) {
    return this.friendsService.sendRequest(userId, dto);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept a received request' })
  accept(@GetUser('id') userId: string, @Body() dto: FriendRequestActionDto) {
    return this.friendsService.acceptRequest(userId, dto);
  }

  @Post('reject')
  @ApiOperation({ summary: 'Reject a received request' })
  reject(@GetUser('id') userId: string, @Body() dto: FriendRequestActionDto) {
    return this.friendsService.rejectRequest(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List accepted friends (paginated)' })
  listFriends(
    @GetUser('id') userId: string,
    @Query() query: FriendsPaginationQueryDto,
  ) {
    return this.friendsService.listFriends(userId, query);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Pending requests you received' })
  pendingRequests(@GetUser('id') userId: string) {
    return this.friendsService.listPendingReceived(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an accepted friendship' })
  unfriend(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) friendshipId: string,
  ) {
    return this.friendsService.unfriend(userId, friendshipId);
  }
}
