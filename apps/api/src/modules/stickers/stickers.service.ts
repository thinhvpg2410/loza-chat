import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toStickerPublicDto } from './mappers/sticker-public.mapper';
import type { StickerPublicDto } from './dto/sticker-public.dto';
import { RecentStickersQueryDto } from './dto/recent-stickers-query.dto';

export interface StickerPackListItemView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  stickerCount: number;
}

export interface StickerPackDetailView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  stickers: StickerPublicDto[];
}

export interface RecentStickerItemView {
  id: string;
  lastUsedAt: Date;
  useCount: number;
  sticker: StickerPublicDto;
}

@Injectable()
export class StickersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActivePacks(): Promise<{ packs: StickerPackListItemView[] }> {
    const packs = await this.prisma.stickerPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            stickers: { where: { isActive: true } },
          },
        },
      },
    });

    return {
      packs: packs.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        stickerCount: p._count.stickers,
      })),
    };
  }

  async getActivePackById(
    packId: string,
  ): Promise<{ pack: StickerPackDetailView }> {
    const pack = await this.prisma.stickerPack.findFirst({
      where: { id: packId, isActive: true },
      include: {
        stickers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!pack) {
      throw new NotFoundException('Sticker pack not found');
    }

    return {
      pack: {
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        description: pack.description,
        thumbnailUrl: pack.thumbnailUrl,
        stickers: pack.stickers.map((s) =>
          toStickerPublicDto({ ...s, pack }),
        ),
      },
    };
  }

  async listRecentForUser(
    userId: string,
    query: RecentStickersQueryDto,
  ): Promise<{ recent: RecentStickerItemView[] }> {
    const limit = RecentStickersQueryDto.resolveLimit(query.limit);
    const rows = await this.prisma.userRecentSticker.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
      include: {
        sticker: {
          include: { pack: true },
        },
      },
    });

    return {
      recent: rows.map((r) => ({
        id: r.id,
        lastUsedAt: r.lastUsedAt,
        useCount: r.useCount,
        sticker: toStickerPublicDto(r.sticker),
      })),
    };
  }

  /**
   * Sticker must exist, belong to an active pack, and be active (sendable).
   */
  async requireSendableSticker(stickerId: string) {
    const sticker = await this.prisma.sticker.findFirst({
      where: {
        id: stickerId,
        isActive: true,
        pack: { isActive: true },
      },
      include: { pack: true },
    });

    if (!sticker) {
      throw new NotFoundException('Sticker not found or not available');
    }

    return sticker;
  }
}
