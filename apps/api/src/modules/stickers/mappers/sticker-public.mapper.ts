import type { Sticker, StickerPack } from '@prisma/client';
import type { StickerPackSummaryDto } from '../dto/sticker-public.dto';
import type { StickerPublicDto } from '../dto/sticker-public.dto';

type StickerWithPack = Sticker & { pack: StickerPack };

export function toStickerPublicDto(sticker: StickerWithPack): StickerPublicDto {
  const pack: StickerPackSummaryDto = {
    id: sticker.pack.id,
    name: sticker.pack.name,
    slug: sticker.pack.slug,
  };
  return {
    id: sticker.id,
    packId: sticker.packId,
    code: sticker.code,
    name: sticker.name,
    assetUrl: sticker.assetUrl,
    width: sticker.width,
    height: sticker.height,
    fileSize: sticker.fileSize,
    pack,
  };
}
