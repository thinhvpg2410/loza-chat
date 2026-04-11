import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UsernameAvailableQueryDto {
  @ApiProperty({ example: 'lan_anh' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'username must be lowercase letters, digits, or underscore',
  })
  username!: string;
}
