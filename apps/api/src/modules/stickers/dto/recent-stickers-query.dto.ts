import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export class RecentStickersQueryDto {
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
