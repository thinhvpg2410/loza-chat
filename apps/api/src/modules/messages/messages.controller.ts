import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import { SendMessageResultOpenApiDto } from './dto/message-view.openapi.dto';
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
}
