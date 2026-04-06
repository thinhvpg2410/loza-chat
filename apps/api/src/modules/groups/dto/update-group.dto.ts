import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_TITLE = 120;

export class UpdateGroupDto {
  @ApiPropertyOptional({ maxLength: MAX_TITLE })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TITLE)
  title?: string;

  @ApiPropertyOptional({
    description: 'Set to empty string to clear the group avatar URL.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
