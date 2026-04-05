import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Friendship } from '@prisma/client';
import { FriendshipStatus } from '../../common/constants/friendship-status';
import { apiOk } from '../../common/http/api-response.util';
import type { ApiResponse } from '../../common/http/api-response.util';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPublicEntity } from '../users/entities/user-public.entity';
import { FriendRequestActionDto } from './dto/friend-request-action.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendsPaginationQueryDto } from './dto/friends-pagination-query.dto';

export type FriendListItem = {
  friendshipId: string;
  user: UserPublicEntity;
  friendsSince: Date;
};

export type FriendsListPayload = {
  items: FriendListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PendingRequestItem = {
  id: string;
  requester: UserPublicEntity;
  createdAt: Date;
};

export type FriendRequestCreatedPayload = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
};

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(
    currentUserId: string,
    dto: FriendRequestDto,
  ): Promise<ApiResponse<FriendRequestCreatedPayload>> {
    const targetUserId = dto.userId;

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const blocked = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.BLOCKED,
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });
    if (blocked) {
      throw new BadRequestException(
        'Cannot send a friend request to this user',
      );
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (existing) {
      this.assertCanCreateNewRequest(existing, currentUserId);
    }

    let created: Friendship;
    try {
      created = await this.prisma.friendship.create({
        data: {
          requesterId: currentUserId,
          receiverId: targetUserId,
          status: FriendshipStatus.PENDING,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A friend request already exists for this pair',
        );
      }
      throw err;
    }

    return apiOk(
      {
        id: created.id,
        requesterId: created.requesterId,
        receiverId: created.receiverId,
        status: created.status,
        createdAt: created.createdAt,
      },
      'Friend request sent',
    );
  }

  private assertCanCreateNewRequest(
    existing: { id: string; requesterId: string; status: string },
    currentUserId: string,
  ): void {
    switch (existing.status) {
      case FriendshipStatus.ACCEPTED:
        throw new BadRequestException('You are already friends with this user');
      case FriendshipStatus.PENDING:
        if (existing.requesterId === currentUserId) {
          throw new BadRequestException('A friend request is already pending');
        }
        throw new BadRequestException(
          'This user has already sent you a request; accept it from your requests list',
        );
      case FriendshipStatus.BLOCKED:
        throw new BadRequestException(
          'Cannot send a friend request to this user',
        );
      default:
        throw new BadRequestException(
          'A relationship already exists with this user',
        );
    }
  }

  async acceptRequest(
    currentUserId: string,
    dto: FriendRequestActionDto,
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    const row = await this.prisma.friendship.findUnique({
      where: { id: dto.requestId },
    });
    if (!row) {
      throw new NotFoundException('Friend request not found');
    }
    if (row.receiverId !== currentUserId) {
      throw new ForbiddenException('Only the invitee can accept this request');
    }
    if (row.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request is not pending');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: row.id },
      data: { status: FriendshipStatus.ACCEPTED },
    });

    return apiOk(
      { id: updated.id, status: updated.status },
      'Request accepted',
    );
  }

  async rejectRequest(
    currentUserId: string,
    dto: FriendRequestActionDto,
  ): Promise<ApiResponse<{ id: string }>> {
    const row = await this.prisma.friendship.findUnique({
      where: { id: dto.requestId },
    });
    if (!row) {
      throw new NotFoundException('Friend request not found');
    }
    if (row.receiverId !== currentUserId) {
      throw new ForbiddenException('Only the invitee can reject this request');
    }
    if (row.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request is not pending');
    }

    await this.prisma.friendship.delete({ where: { id: row.id } });

    return apiOk({ id: row.id }, 'Request rejected');
  }

  async listFriends(
    currentUserId: string,
    query: FriendsPaginationQueryDto,
  ): Promise<ApiResponse<FriendsListPayload>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
    };

    const [total, rows] = await Promise.all([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { requester: true, receiver: true },
      }),
    ]);

    const items: FriendListItem[] = rows.map((row) => {
      const friendUser =
        row.requesterId === currentUserId ? row.receiver : row.requester;
      return {
        friendshipId: row.id,
        user: UserPublicEntity.fromUser(friendUser),
        friendsSince: row.createdAt,
      };
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return apiOk(
      {
        items,
        total,
        page,
        limit,
        totalPages,
      },
      'Friends list',
    );
  }

  async listPendingReceived(
    currentUserId: string,
  ): Promise<ApiResponse<PendingRequestItem[]>> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        receiverId: currentUserId,
        status: FriendshipStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: { requester: true },
    });

    const data: PendingRequestItem[] = rows.map((row) => ({
      id: row.id,
      requester: UserPublicEntity.fromUser(row.requester),
      createdAt: row.createdAt,
    }));

    return apiOk(data, 'Pending requests');
  }

  async unfriend(
    currentUserId: string,
    friendshipId: string,
  ): Promise<ApiResponse<{ removedId: string }>> {
    const row = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!row) {
      throw new NotFoundException('Friendship not found');
    }
    if (row.status !== FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted friendships can be removed');
    }
    if (row.requesterId !== currentUserId && row.receiverId !== currentUserId) {
      throw new ForbiddenException('You are not part of this friendship');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });

    return apiOk({ removedId: friendshipId }, 'Friend removed');
  }
}
