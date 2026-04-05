import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

export class SendOtpDto {
  @ApiProperty({
    example: '+84901234567',
    description: 'E.164 phone number (leading +, country code, subscriber)',
  })
  @IsString()
  @Matches(PHONE_E164_REGEX, {
    message: 'phone must be a valid E.164 number (e.g. +84901234567)',
  })
  phone!: string;
}
