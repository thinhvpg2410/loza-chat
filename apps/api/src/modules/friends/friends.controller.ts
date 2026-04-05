import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsService } from './friends.service';

@ApiTags('friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Pending friend requests you received' })
  async incoming(@GetUser('id') userId: string) {
    const requests = await this.friendsService.listIncomingRequests(userId);
    return { requests };
  }

  @Get('requests/outgoing')
  @ApiOperation({ summary: 'Pending friend requests you sent' })
  async outgoing(@GetUser('id') userId: string) {
    const requests = await this.friendsService.listOutgoingRequests(userId);
    return { requests };
  }

  @Get()
  @ApiOperation({ summary: 'List friends' })
  async friends(@GetUser('id') userId: string) {
    const friends = await this.friendsService.listFriends(userId);
    return { friends };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Unfriend by other user id' })
  async unfriend(
    @GetUser('id') userId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) otherUserId: string,
  ) {
    await this.friendsService.unfriend(userId, otherUserId);
    return { message: 'Unfriended' };
  }

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  async sendRequest(
    @GetUser('id') senderId: string,
    @Body() dto: SendFriendRequestDto,
  ) {
    const row = await this.friendsService.sendRequest(
      senderId,
      dto.receiverId,
      dto.message,
    );
    return { message: 'Friend request sent', ...row };
  }

  @Post('request/:id/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  async accept(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) requestId: string,
  ) {
    await this.friendsService.acceptRequest(requestId, userId);
    return { message: 'Friend request accepted' };
  }

  @Post('request/:id/reject')
  @ApiOperation({ summary: 'Reject a friend request' })
  async reject(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) requestId: string,
  ) {
    await this.friendsService.rejectRequest(requestId, userId);
    return { message: 'Friend request rejected' };
  }

  @Post('request/:id/cancel')
  @ApiOperation({ summary: 'Cancel an outgoing friend request' })
  async cancel(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) requestId: string,
  ) {
    await this.friendsService.cancelRequest(requestId, userId);
    return { message: 'Friend request cancelled' };
  }
}
