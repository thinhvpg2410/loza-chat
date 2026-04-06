import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendMessageWithAttachmentsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;

  @ApiProperty({
    description:
      'Client-generated id for idempotent sends (unique per sender in this conversation)',
    maxLength: 128,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  clientMessageId!: string;

  @ApiProperty({
    enum: MessageType,
    enumName: 'MessageType',
    description: 'Must not be `text` (use POST /messages for text-only).',
  })
  @IsEnum(MessageType)
  @IsNotIn([MessageType.text, MessageType.sticker], {
    message:
      'Use POST /messages for text-only messages and POST /messages/sticker for stickers',
  })
  type!: MessageType;

  @ApiPropertyOptional({
    maxLength: 10_000,
    description: 'Optional caption or secondary text',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  content?: string;

  @ApiProperty({
    type: [String],
    description:
      'Ordered attachment ids (completed uploads owned by you, not yet bound to a message)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  attachmentIds!: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;
}
