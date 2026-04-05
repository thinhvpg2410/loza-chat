import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaKind } from '@prisma/client';

export class AttachmentPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  originalFileName!: string;

  @ApiProperty({ description: 'Size in bytes (stringified for JSON safety)' })
  fileSize!: string;

  @ApiProperty({ enum: MediaKind, enumName: 'MediaKind' })
  attachmentType!: MediaKind;

  @ApiPropertyOptional()
  width!: number | null;

  @ApiPropertyOptional()
  height!: number | null;

  @ApiPropertyOptional()
  durationSeconds!: number | null;

  @ApiPropertyOptional()
  thumbnailKey!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class UploadCompleteResponseDto {
  @ApiProperty({ type: () => AttachmentPublicDto })
  attachment!: AttachmentPublicDto;
}
