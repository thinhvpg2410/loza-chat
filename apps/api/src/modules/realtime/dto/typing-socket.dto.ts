import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TypingSocketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;
}
