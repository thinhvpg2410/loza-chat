import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationType,
  Prisma,
  type User,
} from '@prisma/client';
import { messageContentPreview } from '../../common/utils/message-content-preview';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import { sortUserPair } from '../../common/utils/sort-user-pair';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { ConversationMembershipService } from './conversation-membership.service';
import { ConversationUnreadService } from './conversation-unread.service';
import type {
  ConversationDetailView,
  ConversationListItemView,
} from './types/conversation-views';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly membership: ConversationMembershipService,
    private readonly unread: ConversationUnreadService,
  ) {}

  async createOrGetDirect(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ conversation: ConversationDetailView }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Cannot start a conversation with yourself',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || !target.isActive) {
      throw new NotFoundException('User not found');
    }

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: currentUserId },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException('Cannot message this user');
    }

    const relationship = await this.friends.getRelationshipStatus(
      currentUserId,
      targetUserId,
    );
    if (relationship !== 'friend') {
      throw new ForbiddenException('You can only message friends');
    }

    const [one, two] = sortUserPair(currentUserId, targetUserId);

    const conversationId = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          type: ConversationType.direct,
          directUserOneId: one,
          directUserTwoId: two,
        },
        include: {
          members: { include: { user: true } },
        },
      });

      if (existing) {
        return existing.id;
      }

      try {
        const created = await tx.conversation.create({
          data: {
            type: ConversationType.direct,
            createdById: currentUserId,
            directUserOneId: one,
            directUserTwoId: two,
            members: {
              create: [
                {
                  userId: currentUserId,
                  role: ConversationMemberRole.member,
                },
                {
                  userId: targetUserId,
                  role: ConversationMemberRole.member,
                },
              ],
            },
          },
          include: {
            members: { include: { user: true } },
          },
        });
        return created.id;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const again = await tx.conversation.findFirst({
            where: {
              type: ConversationType.direct,
              directUserOneId: one,
              directUserTwoId: two,
            },
            include: {
              members: { include: { user: true } },
            },
          });
          if (again) {
            return again.id;
          }
        }
        throw err;
      }
    });

    const detail = await this.getConversationDetailForMember(
      currentUserId,
      conversationId,
    );
    return { conversation: detail };
  }

  async listMyConversations(
    userId: string,
  ): Promise<{ conversations: ConversationListItemView[] }> {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      orderBy: { conversation: { updatedAt: 'desc' } },
      include: {
        conversation: {
          include: {
            lastMessage: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    const conversationIds = memberships.map((m) => m.conversationId);
    const unreadMap = await this.unread.countsForConversations(
      userId,
      conversationIds,
    );

    const directConversationIds = [
      ...new Set(
        memberships
          .filter((m) => m.conversation.type === ConversationType.direct)
          .map((m) => m.conversationId),
      ),
    ];

    const directUsersByConversation = new Map<string, User[]>();
    if (directConversationIds.length > 0) {
      const rows = await this.prisma.conversationMember.findMany({
        where: { conversationId: { in: directConversationIds } },
        include: { user: true },
      });
      for (const r of rows) {
        const arr = directUsersByConversation.get(r.conversationId) ?? [];
        arr.push(r.user);
        directUsersByConversation.set(r.conversationId, arr);
      }
    }

    const items: ConversationListItemView[] = [];

    for (const row of memberships) {
      const c = row.conversation;
      const directUsers =
        c.type === ConversationType.direct
          ? (directUsersByConversation.get(c.id) ?? [])
          : [];
      const otherUser = this.resolveOtherDirectParticipant(
        userId,
        c.type,
        directUsers,
      );

      const last = c.lastMessage;

      items.push({
        conversationId: c.id,
        type: c.type,
        title: c.type === ConversationType.group ? c.title ?? null : null,
        avatarUrl: c.type === ConversationType.group ? c.avatarUrl ?? null : null,
        memberCount: c._count.members,
        updatedAt: c.updatedAt,
        mutedUntil: row.mutedUntil,
        lastReadMessageId: row.lastReadMessageId,
        lastDeliveredMessageId: row.lastDeliveredMessageId,
        otherParticipant:
          otherUser && otherUser.isActive
            ? toPublicUserProfile(otherUser)
            : null,
        lastMessage: last
          ? {
              id: last.id,
              type: last.type,
              contentPreview: messageContentPreview(last.type, last.content),
              createdAt: last.createdAt,
              senderId: last.senderId,
            }
          : null,
        unreadCount: unreadMap.get(c.id) ?? 0,
      });
    }

    return { conversations: items };
  }

  async getConversationDetailForMember(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetailView> {
    const member = await this.membership.requireMember(userId, conversationId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: true } },
        _count: { select: { members: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const directUsers =
      conversation.type === ConversationType.direct
        ? conversation.members.map((m) => m.user)
        : [];
    const otherUser = this.resolveOtherDirectParticipant(
      userId,
      conversation.type,
      directUsers,
    );

    return {
      id: conversation.id,
      type: conversation.type,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      title:
        conversation.type === ConversationType.group
          ? conversation.title ?? null
          : null,
      avatarUrl:
        conversation.type === ConversationType.group
          ? conversation.avatarUrl ?? null
          : null,
      memberCount: conversation._count.members,
      otherParticipant:
        otherUser && otherUser.isActive ? toPublicUserProfile(otherUser) : null,
      myMembership: {
        joinedAt: member.joinedAt,
        role: member.role,
        lastReadMessageId: member.lastReadMessageId,
        lastDeliveredMessageId: member.lastDeliveredMessageId,
        mutedUntil: member.mutedUntil,
      },
    };
  }

  private resolveOtherDirectParticipant(
    viewerId: string,
    type: ConversationType,
    users: User[],
  ): User | null {
    if (type !== ConversationType.direct) {
      return null;
    }
    const others = users.filter((u) => u.id !== viewerId);
    return others[0] ?? null;
  }
}
