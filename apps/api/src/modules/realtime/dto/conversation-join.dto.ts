import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ConversationJoinDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;
}
