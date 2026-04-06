import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Validate,
} from 'class-validator';
import { ExactlyOneContactConstraint } from '../validators/exactly-one-contact.validator';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;

/** Exactly one of phoneNumber (E.164) or email must be provided. */
export class ContactOtpDto {
  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  @Matches(E164_PHONE, {
    message: 'phoneNumber must be E.164 format (e.g. +84901234567)',
  })
  @Validate(ExactlyOneContactConstraint)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(320)
  @Validate(ExactlyOneContactConstraint)
  email?: string;
}

export class VerifyContactOtpDto extends ContactOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp!: string;
}
