import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const MAX_INITIAL_MEMBERS = 99;
const MAX_TITLE = 120;

export class CreateGroupDto {
  @ApiProperty({ maxLength: MAX_TITLE })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TITLE)
  title!: string;

  @ApiProperty({
    description: 'Additional members (friends of the creator). Duplicates are ignored.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(MAX_INITIAL_MEMBERS)
  @IsUUID('4', { each: true })
  memberIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  @MaxLength(2048)
  avatarUrl?: string;
}
