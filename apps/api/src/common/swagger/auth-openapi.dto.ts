import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicUserEntityDto } from './public-user-entity.dto';

export class AuthDeviceSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Stable client device identifier' })
  deviceId!: string;

  @ApiProperty({ example: 'ios' })
  platform!: string;
}

/** Session returned after registration, device OTP, QR approve, or trusted-device login. */
export class AuthSessionOpenApiDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds' })
  expiresIn!: number;

  @ApiProperty({ type: PublicUserEntityDto })
  user!: PublicUserEntityDto;

  @ApiProperty({ type: AuthDeviceSummaryDto })
  device!: AuthDeviceSummaryDto;
}

export class LoginSuccessOpenApiDto extends AuthSessionOpenApiDto {
  @ApiProperty({ example: false })
  requiresDeviceVerification!: false;
}

export class LoginDeviceChallengeOpenApiDto {
  @ApiProperty({ example: true })
  requiresDeviceVerification!: true;

  @ApiProperty({
    description: 'JWT used with POST /auth/login/verify-device-otp',
  })
  deviceVerificationToken!: string;

  @ApiProperty({ enum: ['phone', 'email'] })
  otpChannel!: 'phone' | 'email';
}

export class RefreshTokensOpenApiDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;
}

export class QrCreateOpenApiDto {
  @ApiProperty({
    description:
      'Opaque token to embed in QR (64 hex chars); poll GET /auth/qr/status/:sessionToken',
  })
  sessionToken!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}

export class SimpleMessageOpenApiDto {
  @ApiProperty()
  message!: string;
}

export class TokenOnlyOpenApiDto {
  @ApiProperty({
    description:
      'Short-lived JWT (otp proof or reset); use in next step of the flow',
  })
  token!: string;
}

export class QrStatusPendingOpenApiDto {
  @ApiProperty({ enum: ['pending', 'scanned', 'rejected'] })
  status!: 'pending' | 'scanned' | 'rejected';

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}

export class QrStatusTerminalOpenApiDto {
  @ApiProperty({ enum: ['expired', 'not_found'] })
  status!: 'expired' | 'not_found';

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  expiresAt?: Date;
}

export class QrStatusApprovedDeliveredOpenApiDto {
  @ApiProperty({ enum: ['approved'] })
  status!: 'approved';

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ example: true })
  tokensAlreadyDelivered!: true;
}

export class QrStatusApprovedWithSessionOpenApiDto extends AuthSessionOpenApiDto {
  @ApiProperty({ enum: ['approved'] })
  status!: 'approved';

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ example: false })
  tokensAlreadyDelivered!: false;
}
