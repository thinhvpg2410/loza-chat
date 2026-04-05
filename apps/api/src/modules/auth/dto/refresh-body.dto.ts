import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  refreshToken!: string;
}
