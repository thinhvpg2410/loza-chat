import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';

export class ConversationMemberProgressOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastDeliveredMessageId!: string | null;
}

export class ConversationStateOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ enum: ConversationType, enumName: 'ConversationType' })
  type!: ConversationType;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastMessageId!: string | null;

  @ApiProperty({ type: ConversationMemberProgressOpenApiDto })
  me!: ConversationMemberProgressOpenApiDto;

  @ApiPropertyOptional({
    type: ConversationMemberProgressOpenApiDto,
    nullable: true,
    description: 'Direct chat: the other member progress',
  })
  peer!: ConversationMemberProgressOpenApiDto | null;

  @ApiProperty()
  unreadCount!: number;
}
