import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageHistoryQueryDto } from '../messages/dto/message-history-query.dto';
import { MessagesService } from '../messages/messages.service';
import { ConversationProgressService } from './conversation-progress.service';
import { ConversationsService } from './conversations.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { MarkConversationProgressDto } from './dto/mark-conversation-progress.dto';

@ApiTags('conversations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly conversationProgress: ConversationProgressService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
  ) {}

  @Post('direct')
  @ApiOperation({
    summary: 'Create or return an existing direct conversation with a friend',
  })
  async createDirect(
    @GetUser('id') userId: string,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.conversationsService.createOrGetDirect(
      userId,
      dto.targetUserId,
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'List conversations for the current user (most recently active first)',
  })
  async list(@GetUser('id') userId: string) {
    return this.conversationsService.listMyConversations(userId);
  }

  @Get(':id/state')
  @ApiOperation({
    summary:
      'Read/delivered pointers, unread count, and sync metadata for the current member',
  })
  async state(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    const state = await this.conversationProgress.getState(
      userId,
      conversationId,
    );
    return { state };
  }

  @Post(':id/read')
  @ApiOperation({
    summary:
      'Advance read pointer (and delivered if behind). Optional messageId defaults to latest message.',
  })
  async markRead(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: MarkConversationProgressDto = new MarkConversationProgressDto(),
  ) {
    return this.conversationProgress.advanceRead(
      userId,
      conversationId,
      dto.messageId,
    );
  }

  @Post(':id/delivered')
  @ApiOperation({
    summary:
      'Advance delivered pointer. Optional messageId defaults to latest message.',
  })
  async markDelivered(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: MarkConversationProgressDto = new MarkConversationProgressDto(),
  ) {
    return this.conversationProgress.advanceDelivered(
      userId,
      conversationId,
      dto.messageId,
    );
  }

  @Get(':id/messages')
  @ApiOperation({
    summary:
      'Message history (newest first). Pass `nextCursor` to load older messages.',
  })
  async messages(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Query() query: MessageHistoryQueryDto,
  ) {
    return this.messagesService.listMessagesForConversation(
      userId,
      conversationId,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Conversation details (members only)' })
  async getOne(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
  ) {
    const conversation =
      await this.conversationsService.getConversationDetailForMember(
        userId,
        conversationId,
      );
    return { conversation };
  }
}
