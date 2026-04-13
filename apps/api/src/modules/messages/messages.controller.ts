import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForwardMessageDto } from './dto/forward-message.dto';
import {
  MessageActionResultOpenApiDto,
  SendMessageResultOpenApiDto,
} from './dto/message-view.openapi.dto';
import { SendMessageWithAttachmentsDto } from './dto/send-message-with-attachments.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendStickerMessageDto } from './dto/send-sticker-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('with-attachments')
  @ApiOperation({
    summary:
      'Send a message with pre-uploaded attachments (idempotent via clientMessageId)',
  })
  @ApiCreatedResponse({ type: SendMessageResultOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async sendWithAttachments(
    @GetUser('id') userId: string,
    @Body() dto: SendMessageWithAttachmentsDto,
  ) {
    return this.messagesService.sendMessageWithAttachments(userId, dto);
  }

  @Post('sticker')
  @ApiOperation({
    summary:
      'Send a sticker message (idempotent via clientMessageId per sender/conversation)',
  })
  @ApiCreatedResponse({ type: SendMessageResultOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async sendSticker(
    @GetUser('id') userId: string,
    @Body() dto: SendStickerMessageDto,
  ) {
    return this.messagesService.sendStickerMessage(userId, dto);
  }

  @Post()
  @ApiOperation({
    summary:
      'Send a text message (idempotent via clientMessageId per sender/conversation)',
    description:
      'Same persistence and membership rules as Socket.IO `message:send` (text only). New rows broadcast as `message:new` to the conversation room for connected clients.',
  })
  @ApiCreatedResponse({ type: SendMessageResultOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async send(@GetUser('id') userId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendTextMessage(userId, dto);
  }

  @Post(':id/recall')
  @ApiOperation({
    summary: 'Recall (unsend) your message for everyone in the conversation',
  })
  @ApiCreatedResponse({ type: MessageActionResultOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async recall(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) messageId: string,
  ) {
    return this.messagesService.recallMessage(userId, messageId);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete your message (global soft-delete according to current backend design)',
  })
  @ApiCreatedResponse({ type: MessageActionResultOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async remove(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) messageId: string,
  ) {
    return this.messagesService.deleteMessage(userId, messageId);
  }

  @Post(':id/forward')
  @ApiOperation({
    summary: 'Forward a message to another direct conversation you belong to',
  })
  @ApiCreatedResponse({ type: SendMessageResultOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 403, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async forward(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Body() dto: ForwardMessageDto,
  ) {
    return this.messagesService.forwardMessage(
      userId,
      messageId,
      dto.targetConversationId,
      dto.clientMessageId,
    );
  }
}
