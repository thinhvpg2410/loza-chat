import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.decorator';

export class ForgotPasswordResetDto {
  @ApiProperty({
    description: 'JWT from POST /auth/forgot-password/verify-otp',
  })
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  @IsStrongPassword()
  newPassword!: string;
}
