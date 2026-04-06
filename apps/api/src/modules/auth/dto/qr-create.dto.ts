import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Web browser registers a stable device id (e.g. localStorage) before showing QR. */
export class QrCreateDto {
  @ApiProperty({ description: 'Stable browser device id' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  deviceId!: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  appVersion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  deviceName?: string;
}
