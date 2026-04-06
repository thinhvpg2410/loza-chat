import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaKind } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UploadInitDto {
  @ApiProperty({ maxLength: 512 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(256)
  mimeType!: string;

  @ApiProperty({
    description: 'Declared file size in bytes (must match uploaded object)',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  fileSize!: number;

  @ApiProperty({ enum: MediaKind, enumName: 'MediaKind' })
  @IsEnum(MediaKind)
  uploadType!: MediaKind;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(32_000)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(32_000)
  height?: number;

  @ApiPropertyOptional({
    description: 'Media duration in seconds (voice/video)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Opaque client metadata stored as JSON on the session',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
