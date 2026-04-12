import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { PublicUserProfileOpenApiDto } from '../../../common/swagger/public-user-profile.dto';
import { AttachmentPublicDto } from '../../uploads/dto/upload-complete-response.dto';
import { StickerPublicDto } from '../../stickers/dto/sticker-public.dto';

export class ReactionCountOpenApiDto {
  @ApiProperty()
  reaction!: string;

  @ApiProperty()
  count!: number;
}

export class ReactionSummaryOpenApiDto {
  @ApiProperty({ type: [ReactionCountOpenApiDto] })
  counts!: ReactionCountOpenApiDto[];

  @ApiProperty({
    type: [String],
    description: 'Reactions added by the current user',
  })
  mine!: string[];
}

export class MessageViewOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  senderId!: string;

  @ApiProperty()
  clientMessageId!: string;

  @ApiProperty({ enum: MessageType, enumName: 'MessageType' })
  type!: MessageType;

  @ApiPropertyOptional({ nullable: true })
  content!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Opaque JSON metadata from the server (system messages, etc.)',
    type: 'object',
    additionalProperties: true,
  })
  metadataJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  replyToMessageId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: PublicUserProfileOpenApiDto })
  sender!: PublicUserProfileOpenApiDto;

  @ApiProperty({ type: [AttachmentPublicDto] })
  attachments!: AttachmentPublicDto[];

  @ApiPropertyOptional({
    type: () => StickerPublicDto,
    nullable: true,
  })
  sticker!: StickerPublicDto | null;

  @ApiProperty({ type: ReactionSummaryOpenApiDto })
  reactions!: ReactionSummaryOpenApiDto;
}

export class MessageWithReceiptOpenApiDto extends MessageViewOpenApiDto {
  @ApiProperty()
  sentByViewer!: boolean;

  @ApiProperty({
    description:
      'When sentByViewer: peer delivered pointer is at or after this message',
  })
  deliveredToPeer!: boolean;

  @ApiProperty({
    description:
      'When sentByViewer: peer read pointer is at or after this message',
  })
  seenByPeer!: boolean;
}

export class SendMessageResultOpenApiDto {
  @ApiProperty({ type: MessageViewOpenApiDto })
  message!: MessageViewOpenApiDto;

  @ApiProperty({
    description:
      'False when the same clientMessageId was replayed (idempotent)',
  })
  created!: boolean;
}

export class MessageHistoryOpenApiDto {
  @ApiProperty({ type: [MessageWithReceiptOpenApiDto] })
  messages!: MessageWithReceiptOpenApiDto[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Opaque cursor; pass as nextCursor to load older messages',
  })
  nextCursor!: string | null;
}

export class ReactionsSummaryWrapperOpenApiDto {
  @ApiProperty({ type: ReactionSummaryOpenApiDto })
  summary!: ReactionSummaryOpenApiDto;
}

export class AddReactionResultOpenApiDto {
  @ApiProperty({ type: ReactionSummaryOpenApiDto })
  summary!: ReactionSummaryOpenApiDto;

  @ApiProperty({
    description: 'True when this reaction was already present for the user',
  })
  alreadyExists!: boolean;
}
