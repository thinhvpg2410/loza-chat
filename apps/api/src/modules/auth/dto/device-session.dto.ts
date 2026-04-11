import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeviceSessionDto {
  @ApiProperty({ description: 'Stable device identifier from the client' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  deviceId!: string;

  @ApiProperty({ example: 'ios', enum: ['ios', 'android', 'web', 'other'] })
  @IsString()
  @IsIn(['ios', 'android', 'web', 'other'])
  platform!: string;

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
