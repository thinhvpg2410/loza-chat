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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConversationDetailWrapperOpenApiDto,
  ConversationListOpenApiDto,
  ConversationProgressAdvanceOpenApiDto,
  ConversationStateWrapperOpenApiDto,
} from '../../common/swagger/conversation-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageHistoryOpenApiDto } from '../messages/dto/message-view.openapi.dto';
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
  @ApiCreatedResponse({ type: ConversationDetailWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
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
  @ApiOkResponse({ type: ConversationListOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async list(@GetUser('id') userId: string) {
    return this.conversationsService.listMyConversations(userId);
  }

  @Get(':id/state')
  @ApiOperation({
    summary:
      'Read/delivered pointers, unread count, and sync metadata for the current member',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Conversation id' })
  @ApiOkResponse({ type: ConversationStateWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
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
  @ApiParam({ name: 'id', format: 'uuid', description: 'Conversation id' })
  @ApiCreatedResponse({ type: ConversationProgressAdvanceOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async markRead(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body()
    dto: MarkConversationProgressDto = new MarkConversationProgressDto(),
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
  @ApiParam({ name: 'id', format: 'uuid', description: 'Conversation id' })
  @ApiCreatedResponse({ type: ConversationProgressAdvanceOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async markDelivered(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body()
    dto: MarkConversationProgressDto = new MarkConversationProgressDto(),
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
  @ApiParam({ name: 'id', format: 'uuid', description: 'Conversation id' })
  @ApiOkResponse({ type: MessageHistoryOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
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
  @ApiParam({ name: 'id', format: 'uuid', description: 'Conversation id' })
  @ApiOkResponse({ type: ConversationDetailWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
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
