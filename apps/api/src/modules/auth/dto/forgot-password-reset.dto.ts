import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordResetDto {
  @ApiProperty({
    description: 'JWT from POST /auth/forgot-password/verify-otp',
  })
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
