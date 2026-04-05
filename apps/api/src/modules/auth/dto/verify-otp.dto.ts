import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { SendOtpDto } from './send-otp.dto';

export class VerifyOtpDto extends SendOtpDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP from SMS (mock: server logs)',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be exactly 6 digits' })
  otp!: string;
}
