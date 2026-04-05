import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token returned from verify-otp',
    minLength: 32,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  refresh_token!: string;
}
