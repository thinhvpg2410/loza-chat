import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export class MessageHistoryQueryDto {
  @ApiPropertyOptional({
    description:
      'Opaque cursor from `nextCursor` for the next page (older messages). Omit for the first page.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cursor?: string;

  @ApiPropertyOptional({
    default: DEFAULT_LIMIT,
    maximum: MAX_LIMIT,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  static resolveLimit(raw?: number): number {
    const n = raw ?? DEFAULT_LIMIT;
    return Math.min(Math.max(n, 1), MAX_LIMIT);
  }
}
