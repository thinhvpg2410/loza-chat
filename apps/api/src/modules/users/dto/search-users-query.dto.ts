import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import { SearchUsersExactlyOneConstraint } from './search-users-exactly-one.constraint';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;

export class SearchUsersQueryDto {
  @ApiHideProperty()
  @Allow()
  @Transform(() => null)
  @Validate(SearchUsersExactlyOneConstraint)
  _exactlyOneSearchIdentifier!: null;
  @ApiPropertyOptional({ example: '+84901234567' })
  @ValidateIf(
    (o: SearchUsersQueryDto) =>
      typeof o.phoneNumber === 'string' && o.phoneNumber.trim() !== '',
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(E164_PHONE, {
    message: 'phoneNumber must be E.164 format (e.g. +84901234567)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @ValidateIf(
    (o: SearchUsersQueryDto) =>
      typeof o.email === 'string' && o.email.trim() !== '',
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @ValidateIf(
    (o: SearchUsersQueryDto) =>
      typeof o.username === 'string' && o.username.trim() !== '',
  )
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
