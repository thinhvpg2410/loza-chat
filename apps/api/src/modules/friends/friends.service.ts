import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus, Prisma, type User } from '@prisma/client';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import { sortUserPair } from '../../common/utils/sort-user-pair';
import { PrismaService } from '../../prisma/prisma.service';
import type { FriendListEntry } from './types/friend-list-entry';
import type {
  IncomingFriendRequestView,
  OutgoingFriendRequestView,
} from './types/friend-request-view';
import type { RelationshipStatus } from './types/relationship-status';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRelationshipStatus(
    viewerId: string,
    targetUserId: string,
  ): Promise<RelationshipStatus> {
    if (viewerId === targetUserId) {
      return 'self';
    }

    const blockedByMe = await this.prisma.block.findFirst({
      where: { blockerId: viewerId, blockedId: targetUserId },
    });
    if (blockedByMe) {
      return 'blocked_by_me';
    }

    const blockedMe = await this.prisma.block.findFirst({
      where: { blockerId: targetUserId, blockedId: viewerId },
    });
    if (blockedMe) {
      return 'blocked_me';
    }

    const [one, two] = sortUserPair(viewerId, targetUserId);
    const friendship = await this.prisma.friendship.findUnique({
      where: {
        userOneId_userTwoId: { userOneId: one, userTwoId: two },
      },
    });
    if (friendship) {
      return 'friend';
    }

    const outgoing = await this.prisma.friendRequest.findFirst({
      where: {
        senderId: viewerId,
        receiverId: targetUserId,
        status: FriendRequestStatus.pending,
      },
    });
    if (outgoing) {
      return 'outgoing_request';
    }

    const incoming = await this.prisma.friendRequest.findFirst({
      where: {
        senderId: targetUserId,
        receiverId: viewerId,
        status: FriendRequestStatus.pending,
      },
    });
    if (incoming) {
      return 'incoming_request';
    }

    return 'none';
  }

  async sendRequest(
    senderId: string,
    receiverId: string,
    message?: string,
  ): Promise<{ id: string }> {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const receiver = await tx.user.findUnique({
          where: { id: receiverId },
        });
        if (!receiver) {
          throw new NotFoundException('User not found');
        }

        const block = await tx.block.findFirst({
          where: {
            OR: [
              { blockerId: senderId, blockedId: receiverId },
              { blockerId: receiverId, blockedId: senderId },
            ],
          },
        });
        if (block) {
          throw new BadRequestException('Cannot send a request to this user');
        }

        const [one, two] = sortUserPair(senderId, receiverId);
        const friendship = await tx.friendship.findUnique({
          where: {
            userOneId_userTwoId: { userOneId: one, userTwoId: two },
          },
        });
        if (friendship) {
          throw new BadRequestException(
            'You are already friends with this user',
          );
        }

        const pending = await tx.friendRequest.findFirst({
          where: {
            status: FriendRequestStatus.pending,
            OR: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          },
        });
        if (pending) {
          throw new BadRequestException(
            'A pending friend request already exists between you and this user',
          );
        }

        return tx.friendRequest.create({
          data: {
            senderId,
            receiverId,
            status: FriendRequestStatus.pending,
            message: message ?? null,
          },
        });
      });

      return { id: created.id };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A pending friend request already exists between you and this user',
        );
      }
      throw err;
    }
  }

  async acceptRequest(requestId: string, receiverId: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const req = await tx.friendRequest.findUnique({
          where: { id: requestId },
        });
        if (!req) {
          throw new NotFoundException('Friend request not found');
        }
        if (req.receiverId !== receiverId) {
          throw new ForbiddenException(
            'Only the receiver can accept this request',
          );
        }
        if (req.status !== FriendRequestStatus.pending) {
          throw new BadRequestException('This request is no longer pending');
        }

        const block = await tx.block.findFirst({
          where: {
            OR: [
              { blockerId: req.senderId, blockedId: req.receiverId },
              { blockerId: req.receiverId, blockedId: req.senderId },
            ],
          },
        });
        if (block) {
          throw new BadRequestException('Cannot accept: a block is in place');
        }

        const [one, two] = sortUserPair(req.senderId, req.receiverId);
        const existingFriendship = await tx.friendship.findUnique({
          where: {
            userOneId_userTwoId: { userOneId: one, userTwoId: two },
          },
        });
        if (existingFriendship) {
          await tx.friendRequest.update({
            where: { id: requestId },
            data: {
              status: FriendRequestStatus.cancelled,
              respondedAt: new Date(),
            },
          });
          return;
        }

        try {
          await tx.friendship.create({
            data: { userOneId: one, userTwoId: two },
          });
        } catch (createErr) {
          if (
            createErr instanceof Prisma.PrismaClientKnownRequestError &&
            createErr.code === 'P2002'
          ) {
            await tx.friendRequest.update({
              where: { id: requestId },
              data: {
                status: FriendRequestStatus.cancelled,
                respondedAt: new Date(),
              },
            });
            await tx.friendRequest.updateMany({
              where: {
                id: { not: requestId },
                status: FriendRequestStatus.pending,
                OR: [
                  { senderId: req.senderId, receiverId: req.receiverId },
                  { senderId: req.receiverId, receiverId: req.senderId },
                ],
              },
              data: {
                status: FriendRequestStatus.cancelled,
                respondedAt: new Date(),
              },
            });
            return;
          }
          throw createErr;
        }

        await tx.friendRequest.update({
          where: { id: requestId },
          data: {
            status: FriendRequestStatus.accepted,
            respondedAt: new Date(),
          },
        });

        await tx.friendRequest.updateMany({
          where: {
            id: { not: requestId },
            status: FriendRequestStatus.pending,
            OR: [
              { senderId: req.senderId, receiverId: req.receiverId },
              { senderId: req.receiverId, receiverId: req.senderId },
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
  }

  async rejectRequest(requestId: string, receiverId: string): Promise<void> {
    const req = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) {
      throw new NotFoundException('Friend request not found');
    }
    if (req.receiverId !== receiverId) {
      throw new ForbiddenException('Only the receiver can reject this request');
    }
    if (req.status !== FriendRequestStatus.pending) {
      throw new BadRequestException('This request is no longer pending');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: FriendRequestStatus.rejected,
        respondedAt: new Date(),
      },
    });
  }

  async cancelRequest(requestId: string, senderId: string): Promise<void> {
    const req = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) {
      throw new NotFoundException('Friend request not found');
    }
    if (req.senderId !== senderId) {
      throw new ForbiddenException('Only the sender can cancel this request');
    }
    if (req.status !== FriendRequestStatus.pending) {
      throw new BadRequestException('This request is no longer pending');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: FriendRequestStatus.cancelled,
        respondedAt: new Date(),
      },
    });
  }

  async listFriends(userId: string): Promise<FriendListEntry[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: { userOne: true, userTwo: true },
    });

    const out: FriendListEntry[] = [];
    for (const row of rows) {
      const other: User = row.userOneId === userId ? row.userTwo : row.userOne;
      if (!other.isActive) {
        continue;
      }
      out.push({
        friendshipId: row.id,
        ...toPublicUserProfile(other),
        friendsSince: row.createdAt,
      });
    }
    return out;
  }

  /** Friend user ids for realtime presence fan-out (includes inactive users; clients may filter). */
  async listFriendUserIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: { userOneId: true, userTwoId: true },
    });
    return rows.map((row) =>
      row.userOneId === userId ? row.userTwoId : row.userOneId,
    );
  }

  async unfriend(currentUserId: string, otherUserId: string): Promise<void> {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('Invalid target user');
    }

    await this.prisma.$transaction(async (tx) => {
      const [one, two] = sortUserPair(currentUserId, otherUserId);
      const result = await tx.friendship.deleteMany({
        where: { userOneId: one, userTwoId: two },
      });
      if (result.count === 0) {
        throw new NotFoundException('Friendship not found');
      }

      await tx.friendRequest.updateMany({
        where: {
          status: FriendRequestStatus.pending,
          OR: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId },
          ],
        },
        data: {
          status: FriendRequestStatus.cancelled,
          respondedAt: new Date(),
        },
      });
    });
  }

  async listIncomingRequests(
    receiverId: string,
  ): Promise<IncomingFriendRequestView[]> {
    const rows = await this.prisma.friendRequest.findMany({
      where: {
        receiverId,
        status: FriendRequestStatus.pending,
      },
      orderBy: { createdAt: 'desc' },
      include: { sender: true },
    });

    return rows.map((row) => ({
      id: row.id,
      message: row.message,
      createdAt: row.createdAt,
      sender: toPublicUserProfile(row.sender),
    }));
  }

  async listOutgoingRequests(
    senderId: string,
  ): Promise<OutgoingFriendRequestView[]> {
    const rows = await this.prisma.friendRequest.findMany({
      where: {
        senderId,
        status: FriendRequestStatus.pending,
      },
      orderBy: { createdAt: 'desc' },
      include: { receiver: true },
    });

    return rows.map((row) => ({
      id: row.id,
      message: row.message,
      createdAt: row.createdAt,
      receiver: toPublicUserProfile(row.receiver),
    }));
  }
}
