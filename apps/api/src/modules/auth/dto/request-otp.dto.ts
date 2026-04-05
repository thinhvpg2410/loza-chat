import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;

export class RequestOtpDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  @Matches(E164_PHONE, {
    message: 'phoneNumber must be E.164 format (e.g. +84901234567)',
  })
  phoneNumber!: string;
}
