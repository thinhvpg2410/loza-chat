import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConversationMemberRole,
  ConversationMemberStatus,
  ConversationType,
  MessageType,
} from '@prisma/client';
import { PublicUserProfileOpenApiDto } from './public-user-profile.dto';
import { ConversationStateOpenApiDto } from './conversation-state.openapi.dto';

export class ConversationLastMessagePreviewOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: MessageType, enumName: 'MessageType' })
  type!: MessageType;

  @ApiPropertyOptional({ nullable: true })
  contentPreview!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'uuid' })
  senderId!: string;
}

export class ConversationListItemOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ enum: ConversationType, enumName: 'ConversationType' })
  type!: ConversationType;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty()
  memberCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  mutedUntil!: Date | null;

  @ApiPropertyOptional({
    type: PublicUserProfileOpenApiDto,
    nullable: true,
    description: 'Other participant for direct chats',
  })
  otherParticipant!: PublicUserProfileOpenApiDto | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Direct chats only: relationship between viewer and otherParticipant (for UI warnings). Sending is blocked only when blocked_by_me or blocked_me.',
  })
  directPeerRelationshipStatus!: string | null;

  @ApiPropertyOptional({
    type: ConversationLastMessagePreviewOpenApiDto,
    nullable: true,
  })
  lastMessage!: ConversationLastMessagePreviewOpenApiDto | null;

  @ApiProperty()
  unreadCount!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastDeliveredMessageId!: string | null;
}

export class ConversationListOpenApiDto {
  @ApiProperty({ type: [ConversationListItemOpenApiDto] })
  conversations!: ConversationListItemOpenApiDto[];
}

export class MyMembershipOpenApiDto {
  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: Date;

  @ApiPropertyOptional({
    enum: ConversationMemberRole,
    enumName: 'ConversationMemberRole',
    nullable: true,
  })
  role!: ConversationMemberRole | null;

  @ApiProperty({
    enum: ConversationMemberStatus,
    enumName: 'ConversationMemberStatus',
  })
  status!: ConversationMemberStatus;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastDeliveredMessageId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  mutedUntil!: Date | null;
}

export class ConversationDetailOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ConversationType, enumName: 'ConversationType' })
  type!: ConversationType;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty()
  memberCount!: number;

  @ApiPropertyOptional({
    type: PublicUserProfileOpenApiDto,
    nullable: true,
  })
  otherParticipant!: PublicUserProfileOpenApiDto | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Direct chats only: relationship between viewer and otherParticipant (for UI warnings).',
  })
  directPeerRelationshipStatus!: string | null;

  @ApiProperty({ type: MyMembershipOpenApiDto })
  myMembership!: MyMembershipOpenApiDto;
}

export class ConversationDetailWrapperOpenApiDto {
  @ApiProperty({ type: ConversationDetailOpenApiDto })
  conversation!: ConversationDetailOpenApiDto;
}

export class ConversationStateWrapperOpenApiDto {
  @ApiProperty({ type: ConversationStateOpenApiDto })
  state!: ConversationStateOpenApiDto;
}

export class ConversationProgressAdvanceOpenApiDto {
  @ApiProperty({ type: ConversationStateOpenApiDto })
  state!: ConversationStateOpenApiDto;

  @ApiProperty({
    description: 'ISO timestamp when the pointer was advanced',
  })
  at!: string;
}
