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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddReactionDto } from './dto/add-reaction.dto';
import {
  AddReactionResultOpenApiDto,
  ReactionsSummaryWrapperOpenApiDto,
} from './dto/message-view.openapi.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageReactionsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':messageId/reactions')
  @ApiOperation({
    summary: 'List reactions for a message (counts and your reactions)',
  })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  @ApiOkResponse({ type: ReactionsSummaryWrapperOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async list(
    @GetUser('id') userId: string,
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
  ) {
    return this.messagesService.getReactionsForMessage(userId, messageId);
  }

  @Post(':messageId/reactions')
  @ApiOperation({
    summary:
      'Add a reaction (idempotent: duplicate returns existing summary without error)',
  })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  @ApiCreatedResponse({ type: AddReactionResultOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async add(
    @GetUser('id') userId: string,
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.messagesService.addReaction(userId, messageId, dto.reaction);
  }

  @Delete(':messageId/reactions/:reaction')
  @ApiOperation({ summary: 'Remove your reaction for this message' })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  @ApiParam({
    name: 'reaction',
    description: 'Emoji or short code; URL-encoded when needed',
  })
  @ApiOkResponse({ type: ReactionsSummaryWrapperOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async remove(
    @GetUser('id') userId: string,
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Param('reaction') reaction: string,
  ) {
    const decoded = decodeURIComponent(reaction);
    return this.messagesService.removeReaction(userId, messageId, decoded);
  }
}
