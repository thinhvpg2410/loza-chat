import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MarkConversationProgressDto {
  @ApiPropertyOptional({
    description:
      'Message to mark up to. Omit to use the latest non-deleted message in the conversation.',
  })
  @IsOptional()
  @IsUUID('4')
  messageId?: string;
}
