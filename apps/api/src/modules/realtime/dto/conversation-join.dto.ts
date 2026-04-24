import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ConversationJoinDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  correlationId?: string;
}
