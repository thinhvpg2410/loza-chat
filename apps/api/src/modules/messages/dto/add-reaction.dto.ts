import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ALLOWED_MESSAGE_REACTIONS } from '../constants/reaction-allowlist';

export class AddReactionDto {
  @ApiProperty({
    description: 'Emoji reaction (must be in the server allow-list)',
    example: '👍',
    maxLength: 32,
    enum: [...ALLOWED_MESSAGE_REACTIONS],
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @IsIn([...ALLOWED_MESSAGE_REACTIONS])
  reaction!: string;
}
