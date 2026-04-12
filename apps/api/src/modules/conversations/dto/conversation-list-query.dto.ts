import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ConversationListQueryDto {
  @ApiPropertyOptional({
    enum: ConversationType,
    description:
      'Return only `direct` (1:1) or `group` threads. Omit for all conversations.',
  })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;
}
