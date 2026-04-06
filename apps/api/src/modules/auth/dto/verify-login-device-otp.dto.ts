import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class VerifyLoginDeviceOtpDto {
  @ApiProperty({
    description: 'JWT from POST /auth/login when requiresDeviceVerification is true',
  })
  @IsString()
  @MinLength(20)
  deviceVerificationToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp!: string;
}
