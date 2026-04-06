import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Opaque session token from QR (64 hex chars from POST /auth/qr/create). */
export class QrSessionTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @Matches(/^[a-f0-9]+$/i, {
    message: 'sessionToken must be 64 hexadecimal characters',
  })
  sessionToken!: string;
}
