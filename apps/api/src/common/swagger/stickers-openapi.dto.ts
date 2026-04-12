import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StickerPublicDto } from '../../modules/stickers/dto/sticker-public.dto';

export class StickerPackListItemOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty()
  stickerCount!: number;
}

export class StickerPacksListOpenApiDto {
  @ApiProperty({ type: [StickerPackListItemOpenApiDto] })
  packs!: StickerPackListItemOpenApiDto[];
}

export class StickerPackDetailOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ type: [StickerPublicDto] })
  stickers!: StickerPublicDto[];
}

export class StickerPackDetailWrapperOpenApiDto {
  @ApiProperty({ type: StickerPackDetailOpenApiDto })
  pack!: StickerPackDetailOpenApiDto;
}

export class RecentStickerRowOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  lastUsedAt!: Date;

  @ApiProperty()
  useCount!: number;

  @ApiProperty({ type: StickerPublicDto })
  sticker!: StickerPublicDto;
}

export class RecentStickersOpenApiDto {
  @ApiProperty({ type: [RecentStickerRowOpenApiDto] })
  recent!: RecentStickerRowOpenApiDto[];
}
