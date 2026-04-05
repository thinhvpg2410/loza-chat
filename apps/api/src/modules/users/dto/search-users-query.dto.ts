import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchUsersQueryDto {
  @ApiProperty({ description: 'Search by phone or name (partial match)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q!: string;
}
