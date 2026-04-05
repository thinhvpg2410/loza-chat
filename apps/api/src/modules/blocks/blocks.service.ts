import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus } from '@prisma/client';
import { sortUserPair } from '../../common/utils/sort-user-pair';
import { PrismaService } from '../../prisma/prisma.service';

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

    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    const [one, two] = sortUserPair(blockerId, blockedId);

    await this.prisma.$transaction(async (tx) => {
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
    });
  }

  async removeBlock(blockerId: string, blockedId: string): Promise<void> {
    const result = await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Block record not found');
    }
  }
}
