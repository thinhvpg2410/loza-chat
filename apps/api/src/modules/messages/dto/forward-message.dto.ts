import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ForwardMessageDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Target conversation id (direct or group). Sender must be an active member; group posting rules apply.',
  })
  @IsUUID('4')
  targetConversationId!: string;

  @ApiProperty({
    description:
      'Client-generated id for idempotent sends (unique per sender in target conversation)',
    maxLength: 128,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  clientMessageId!: string;
}
