import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Other user to open or resume a direct chat with',
  })
  @IsUUID('4')
  targetUserId!: string;
}
