import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class MessageSendSocketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;

  @ApiProperty({ maxLength: 128 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  clientMessageId!: string;

  @ApiProperty({ enum: MessageType, enumName: 'MessageType' })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiProperty({ maxLength: 10_000 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  correlationId?: string;
}
