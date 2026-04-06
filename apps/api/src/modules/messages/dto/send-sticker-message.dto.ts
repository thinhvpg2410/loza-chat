import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendStickerMessageDto {
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

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  stickerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;
}
