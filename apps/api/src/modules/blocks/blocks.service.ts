import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus, Prisma } from '@prisma/client';
import type { PublicUserProfile } from '../../common/types/public-user-profile';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import { sortUserPair } from '../../common/utils/sort-user-pair';
import { PrismaService } from '../../prisma/prisma.service';

export type BlockedUserListEntry = {
  user: PublicUserProfile;
  blockedAt: string;
};

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async isEitherBlocked(userA: string, userB: string): Promise<boolean> {
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return row !== null;
  }

  async createBlock(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const target = await tx.user.findUnique({
            where: { id: blockedId },
          });
          if (!target) {
            throw new NotFoundException('User not found');
          }

          const existing = await tx.block.findUnique({
            where: {
              blockerId_blockedId: { blockerId, blockedId },
            },
          });
          if (existing) {
            throw new ConflictException('User is already blocked');
          }

          const [one, two] = sortUserPair(blockerId, blockedId);

          await tx.block.create({
            data: { blockerId, blockedId },
          });

          await tx.friendship.deleteMany({
            where: { userOneId: one, userTwoId: two },
          });

          await tx.friendRequest.updateMany({
            where: {
              status: FriendRequestStatus.pending,
              OR: [
                { senderId: blockerId, receiverId: blockedId },
                { senderId: blockedId, receiverId: blockerId },
              ],
            },
            data: {
              status: FriendRequestStatus.cancelled,
              respondedAt: new Date(),
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('User is already blocked');
      }
      throw err;
    }
  }

  async removeBlock(blockerId: string, blockedId: string): Promise<void> {
    const result = await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Block record not found');
    }
  }

  async listBlockedBy(blockerId: string): Promise<BlockedUserListEntry[]> {
    const rows = await this.prisma.block.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      include: { blocked: true },
    });
    return rows.map((row) => ({
      user: toPublicUserProfile(row.blocked),
      blockedAt: row.createdAt.toISOString(),
    }));
  }
}
