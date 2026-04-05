import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;

export class SearchUsersQueryDto {
  @ApiPropertyOptional({ example: '+84901234567' })
  @ValidateIf((o: SearchUsersQueryDto) => o.username === undefined)
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(E164_PHONE, {
    message: 'phoneNumber must be E.164 format (e.g. +84901234567)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @ValidateIf((o: SearchUsersQueryDto) => o.phoneNumber === undefined)
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'username must be lowercase letters, digits, or underscore',
  })
  username?: string;
}
