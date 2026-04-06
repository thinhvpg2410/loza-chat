import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  Prisma,
  type Message,
  type User,
} from '@prisma/client';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { FriendsService } from '../friends/friends.service';
import { GroupDomainEventsService } from './group-domain-events.service';
import { GroupPermissionsService } from './group-permissions.service';
import type { AddGroupMembersDto } from './dto/add-group-members.dto';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupDetailView, GroupMemberView } from './types/group-detail.view';

type Tx = Prisma.TransactionClient;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly membership: ConversationMembershipService,
    private readonly permissions: GroupPermissionsService,
    private readonly domainEvents: GroupDomainEventsService,
  ) {}

  async createGroup(
    creatorId: string,
    dto: CreateGroupDto,
  ): Promise<{ group: GroupDetailView }> {
    const titleTrim = dto.title.trim();
    if (!titleTrim) {
      throw new BadRequestException('Title is required');
    }

    const uniqueMemberIds = [
      ...new Set(dto.memberIds.filter((id) => id !== creatorId)),
    ];

    await this.assertTargetsInvitable(creatorId, uniqueMemberIds);

    const { conversationId, systemMessageId } = await this.prisma.$transaction(
      async (tx) => {
        const conv = await tx.conversation.create({
          data: {
            type: ConversationType.group,
            title: titleTrim,
            avatarUrl: dto.avatarUrl ?? null,
            createdById: creatorId,
            members: {
              create: [
                {
                  userId: creatorId,
                  role: ConversationMemberRole.owner,
                },
                ...uniqueMemberIds.map((userId) => ({
                  userId,
                  role: ConversationMemberRole.member,
                })),
              ],
            },
          },
        });

        const creator = await tx.user.findUniqueOrThrow({
          where: { id: creatorId },
        });
        const addedUsers =
          uniqueMemberIds.length > 0
            ? await tx.user.findMany({ where: { id: { in: uniqueMemberIds } } })
            : [];

        const content = this.buildGroupCreatedContent(
          creator.displayName,
          titleTrim,
          addedUsers.map((u) => u.displayName),
        );

        const msg = await this.appendSystemMessage(tx, {
          conversationId: conv.id,
          actorId: creatorId,
          content,
          metadata: {
            kind: 'group_created',
            title: titleTrim,
            addedUserIds: uniqueMemberIds,
          },
        });

        return { conversationId: conv.id, systemMessageId: msg.id };
      },
    );

    this.emitSystemMessage(conversationId, systemMessageId);

    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: { title: titleTrim, avatarUrl: dto.avatarUrl ?? null },
    });

    const group = await this.getGroupDetailForMember(creatorId, conversationId);
    return { group };
  }

  async getGroupDetailForMember(
    viewerId: string,
    conversationId: string,
  ): Promise<GroupDetailView> {
    await this.membership.requireMember(viewerId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: { user: true },
          orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
        },
      },
    });

    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const me = conv.members.find((m) => m.userId === viewerId);
    if (!me) {
      throw new ForbiddenException('Not a member of this group');
    }

    return this.toGroupDetailView(conv, this.permissions.normalizeRole(me.role));
  }

  async updateGroup(
    actorId: string,
    conversationId: string,
    dto: UpdateGroupDto,
  ): Promise<{ group: GroupDetailView }> {
    if (dto.title === undefined && dto.avatarUrl === undefined) {
      throw new BadRequestException('Provide title and/or avatarUrl');
    }

    const member = await this.membership.requireMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const actorRole = this.permissions.normalizeRole(member.role);

    if (dto.title !== undefined) {
      this.permissions.assertCanManageGroupContent(actorRole);
    }
    if (dto.avatarUrl !== undefined) {
      this.permissions.assertCanEditAvatar(actorRole);
    }

    const titleTrim =
      dto.title !== undefined ? dto.title.trim() : undefined;
    if (titleTrim !== undefined && !titleTrim) {
      throw new BadRequestException('Title cannot be empty');
    }

    const avatarNext =
      dto.avatarUrl !== undefined
        ? dto.avatarUrl.trim() === ''
          ? null
          : dto.avatarUrl.trim()
        : undefined;

    const newSystemMessageIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ConversationUpdateInput = {};
      if (titleTrim !== undefined) {
        data.title = titleTrim;
      }
      if (avatarNext !== undefined) {
        data.avatarUrl = avatarNext;
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data,
      });

      if (titleTrim !== undefined && titleTrim !== conv.title) {
        const content = `${await this.displayName(tx, actorId)} changed the group name to "${titleTrim}"`;
        const msg = await this.appendSystemMessage(tx, {
          conversationId,
          actorId,
          content,
          metadata: {
            kind: 'title_changed',
            previousTitle: conv.title,
            newTitle: titleTrim,
          },
        });
        newSystemMessageIds.push(msg.id);
      }

      if (avatarNext !== undefined && avatarNext !== conv.avatarUrl) {
        const content = `${await this.displayName(tx, actorId)} updated the group photo`;
        const msg = await this.appendSystemMessage(tx, {
          conversationId,
          actorId,
          content,
          metadata: { kind: 'avatar_updated' },
        });
        newSystemMessageIds.push(msg.id);
      }
    });

    for (const mid of newSystemMessageIds) {
      this.emitSystemMessage(conversationId, mid);
    }

    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {
        title: titleTrim ?? conv.title,
        avatarUrl: avatarNext ?? conv.avatarUrl,
      },
    });

    const group = await this.getGroupDetailForMember(actorId, conversationId);
    return { group };
  }

  async addMembers(
    actorId: string,
    conversationId: string,
    dto: AddGroupMembersDto,
  ): Promise<{ group: GroupDetailView }> {
    const member = await this.membership.requireMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);
    this.permissions.assertCanManageGroupContent(member.role);

    const existing = new Set(conv.members.map((m) => m.userId));
    const uniqueIncoming = [...new Set(dto.memberIds)];
    const toAdd = uniqueIncoming.filter((id) => !existing.has(id));

    if (toAdd.length === 0) {
      const group = await this.getGroupDetailForMember(actorId, conversationId);
      return { group };
    }

    await this.assertTargetsInvitable(actorId, toAdd);

    let systemMessageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.createMany({
        data: toAdd.map((userId) => ({
          conversationId,
          userId,
          role: ConversationMemberRole.member,
        })),
      });

      const actorName = await this.displayName(tx, actorId);
      const addedUsers = await tx.user.findMany({ where: { id: { in: toAdd } } });
      const names = addedUsers.map((u) => u.displayName).filter(Boolean);
      const content = `${actorName} added ${this.joinDisplayNames(names)}`;

      const msg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content,
        metadata: {
          kind: 'members_added',
          actorId,
          addedUserIds: toAdd,
        },
      });
      systemMessageId = msg.id;
    });

    if (systemMessageId) {
      this.emitSystemMessage(conversationId, systemMessageId);
    }

    this.domainEvents.emit({
      type: 'group.member_added',
      conversationId,
      userIds: toAdd,
    });

    const group = await this.getGroupDetailForMember(actorId, conversationId);
    return { group };
  }

  async removeMember(
    actorId: string,
    conversationId: string,
    targetUserId: string,
  ): Promise<{ group: GroupDetailView }> {
    if (actorId === targetUserId) {
      throw new ForbiddenException('Use POST /groups/:id/leave to leave the group');
    }

    const actorMember = await this.membership.requireMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);
    this.permissions.assertCanManageGroupContent(actorMember.role);

    const target = conv.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('User is not in this group');
    }

    this.permissions.assertActorCanRemoveMember(actorMember.role, target.role);

    let systemMessageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.delete({
        where: {
          conversationId_userId: {
            conversationId,
            userId: targetUserId,
          },
        },
      });

      const actorName = await this.displayName(tx, actorId);
      const targetName = await this.displayName(tx, targetUserId);
      const content = `${actorName} removed ${targetName}`;

      const msg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content,
        metadata: {
          kind: 'member_removed',
          actorId,
          removedUserId: targetUserId,
        },
      });
      systemMessageId = msg.id;
    });

    if (systemMessageId) {
      this.emitSystemMessage(conversationId, systemMessageId);
    }

    this.domainEvents.emit({
      type: 'group.member_removed',
      conversationId,
      userId: targetUserId,
    });

    const group = await this.getGroupDetailForMember(actorId, conversationId);
    return { group };
  }

  async leaveGroup(
    actorId: string,
    conversationId: string,
  ): Promise<{ left: true }> {
    const member = await this.membership.requireMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const actorRole = this.permissions.normalizeRole(member.role);
    const others = conv.members.filter((m) => m.userId !== actorId);

    if (actorRole === ConversationMemberRole.owner) {
      if (others.length === 0) {
        throw new BadRequestException(
          'You are the only member; delete the conversation from the client or contact support',
        );
      }

      const successor = this.pickOwnershipSuccessor(others);

      const ownerLeaveMessageIds: string[] = [];

      await this.prisma.$transaction(async (tx) => {
        await tx.conversationMember.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId: successor.userId,
            },
          },
          data: { role: ConversationMemberRole.owner },
        });

        const fromName = await this.displayName(tx, actorId);
        const toName = await this.displayName(tx, successor.userId);
        const transferContent = `${fromName} transferred ownership to ${toName}`;
        const transferMsg = await this.appendSystemMessage(tx, {
          conversationId,
          actorId,
          content: transferContent,
          metadata: {
            kind: 'ownership_transferred',
            fromUserId: actorId,
            toUserId: successor.userId,
          },
        });
        ownerLeaveMessageIds.push(transferMsg.id);

        await tx.conversationMember.delete({
          where: {
            conversationId_userId: { conversationId, userId: actorId },
          },
        });

        const leftContent = `${fromName} left the group`;
        const leftMsg = await this.appendSystemMessage(tx, {
          conversationId,
          actorId,
          content: leftContent,
          metadata: { kind: 'member_left', userId: actorId },
        });
        ownerLeaveMessageIds.push(leftMsg.id);
      });

      for (const mid of ownerLeaveMessageIds) {
        this.emitSystemMessage(conversationId, mid);
      }

      this.domainEvents.emit({
        type: 'group.member_removed',
        conversationId,
        userId: actorId,
      });
      this.domainEvents.emit({
        type: 'group.updated',
        conversationId,
        payload: {},
      });

      return { left: true };
    }

    let systemMessageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.delete({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });

      const name = await this.displayName(tx, actorId);
      const content = `${name} left the group`;
      const msg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content,
        metadata: { kind: 'member_left', userId: actorId },
      });
      systemMessageId = msg.id;
    });

    if (systemMessageId) {
      this.emitSystemMessage(conversationId, systemMessageId);
    }

    this.domainEvents.emit({
      type: 'group.member_removed',
      conversationId,
      userId: actorId,
    });

    return { left: true };
  }

  private pickOwnershipSuccessor(
    others: { userId: string; joinedAt: Date }[],
  ): { userId: string; joinedAt: Date } {
    const sorted = [...others].sort((a, b) => {
      const t = a.joinedAt.getTime() - b.joinedAt.getTime();
      if (t !== 0) {
        return t;
      }
      return a.userId.localeCompare(b.userId);
    });
    return sorted[0]!;
  }

  private emitSystemMessage(conversationId: string, messageId: string): void {
    this.domainEvents.emit({
      type: 'group.system_message',
      conversationId,
      messageId,
    });
  }

  private async assertTargetsInvitable(
    actorId: string,
    targetUserIds: string[],
  ): Promise<void> {
    for (const tid of targetUserIds) {
      const u = await this.prisma.user.findUnique({ where: { id: tid } });
      if (!u?.isActive) {
        throw new NotFoundException('One or more users were not found');
      }
      const rel = await this.friends.getRelationshipStatus(actorId, tid);
      if (rel !== 'friend') {
        throw new ForbiddenException(
          'You can only add users you are friends with',
        );
      }
    }
  }

  private buildGroupCreatedContent(
    creatorDisplayName: string,
    title: string,
    addedNames: string[],
  ): string {
    if (addedNames.length === 0) {
      return `${creatorDisplayName} created the group "${title}"`;
    }
    return `${creatorDisplayName} created the group "${title}" and added ${this.joinDisplayNames(addedNames)}`;
  }

  private joinDisplayNames(names: string[]): string {
    const n = names.filter((x) => x.length > 0);
    if (n.length === 0) {
      return 'new members';
    }
    if (n.length === 1) {
      return n[0]!;
    }
    if (n.length === 2) {
      return `${n[0]} and ${n[1]}`;
    }
    return `${n.slice(0, -1).join(', ')}, and ${n[n.length - 1]}`;
  }

  private async displayName(tx: Tx, userId: string): Promise<string> {
    const u = await tx.user.findUnique({ where: { id: userId } });
    return u?.displayName?.trim() || 'Someone';
  }

  private async appendSystemMessage(
    tx: Tx,
    params: {
      conversationId: string;
      actorId: string;
      content: string;
      metadata: Prisma.JsonObject;
    },
  ): Promise<Message> {
    const msg = await tx.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.actorId,
        clientMessageId: randomUUID(),
        type: MessageType.system,
        content: params.content,
        metadataJson: params.metadata,
      },
    });

    await tx.conversation.update({
      where: { id: params.conversationId },
      data: { lastMessageId: msg.id },
    });

    return msg;
  }

  private toGroupDetailView(
    conv: {
      id: string;
      title: string | null;
      avatarUrl: string | null;
      createdById: string | null;
      createdAt: Date;
      updatedAt: Date;
      members: { userId: string; role: ConversationMemberRole | null; joinedAt: Date; user: User }[];
    },
    myRole: ConversationMemberRole,
  ): GroupDetailView {
    const members: GroupMemberView[] = conv.members.map((m) => ({
      userId: m.userId,
      role: this.permissions.normalizeRole(m.role),
      joinedAt: m.joinedAt,
      user: toPublicUserProfile(m.user),
    }));

    return {
      conversationId: conv.id,
      title: conv.title,
      avatarUrl: conv.avatarUrl,
      createdById: conv.createdById,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      myRole,
      members,
    };
  }
}
