import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MessageReceiptSocketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  messageId!: string;
}
