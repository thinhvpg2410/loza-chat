import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StickerPackSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class StickerPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  packId!: string;

  @ApiPropertyOptional({ nullable: true })
  code!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  assetUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;

  @ApiPropertyOptional({ nullable: true })
  fileSize!: number | null;

  @ApiProperty({ type: StickerPackSummaryDto })
  pack!: StickerPackSummaryDto;
}
