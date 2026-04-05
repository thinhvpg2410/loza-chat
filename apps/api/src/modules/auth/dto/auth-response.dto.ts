import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'OTP sent (check server logs in development)' })
  message!: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '+84901234567' })
  phone!: string;

  @ApiProperty({ example: 'Alex', nullable: true })
  name!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ description: 'JWT access token (15m)' })
  access_token!: string;

  @ApiProperty({ description: 'Opaque refresh token (7d), store securely' })
  refresh_token!: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class RefreshAccessResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  access_token!: string;
}
