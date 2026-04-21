import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationMemberStatus,
  ConversationType,
  GroupJoinRequestStatus,
  MessageType,
  Prisma,
  type Message,
  type User,
} from '@prisma/client';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { MessagesService } from '../messages/messages.service';
import { FriendsService } from '../friends/friends.service';
import { GroupDomainEventsService } from './group-domain-events.service';
import { GroupPermissionsService } from './group-permissions.service';
import type { AddGroupMembersDto } from './dto/add-group-members.dto';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { TransferGroupOwnershipDto } from './dto/transfer-group-ownership.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { UpdateGroupMemberRoleDto } from './dto/update-group-member-role.dto';
import type { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';
import { parseGroupSettings, mergeGroupSettingsPatch } from './group-settings.util';
import type { GroupDetailView, GroupMemberView } from './types/group-detail.view';
import type { GroupSettingsView } from './types/group-settings.view';

type Tx = Prisma.TransactionClient;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly membership: ConversationMembershipService,
    private readonly permissions: GroupPermissionsService,
    private readonly domainEvents: GroupDomainEventsService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messages: MessagesService,
  ) {}

  private async appendAuditLog(
    tx: Tx,
    params: {
      conversationId: string;
      actorUserId: string;
      action: 'member_role_updated' | 'ownership_transferred' | 'group_dissolved';
      targetUserId?: string;
      payload?: Prisma.JsonObject;
    },
  ): Promise<void> {
    await tx.$executeRaw`
      INSERT INTO "group_audit_logs"
        ("id","conversation_id","actor_user_id","action","target_user_id","payload_json","created_at")
      VALUES
        (
          gen_random_uuid()::text,
          ${params.conversationId},
          ${params.actorUserId},
          ${params.action},
          ${params.targetUserId ?? null},
          ${params.payload ? (params.payload as Prisma.JsonObject) : null}::jsonb,
          NOW()
        )
    `;
  }

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

    if (uniqueMemberIds.length < 1) {
      throw new BadRequestException(
        'A group must have at least two people (you plus at least one other member)',
      );
    }

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
                  status: ConversationMemberStatus.active,
                },
                ...uniqueMemberIds.map((userId) => ({
                  userId,
                  role: ConversationMemberRole.member,
                  status: ConversationMemberStatus.active,
                })),
              ],
            },
          },
        });

        const creator = await tx.user.findUniqueOrThrow({
          where: { id: creatorId },
        });
        const addedUsers = await tx.user.findMany({
          where: { id: { in: uniqueMemberIds } },
        });

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

    await this.publishSystemMessages(conversationId, [systemMessageId]);

    this.domainEvents.emit({
      type: 'group.created',
      conversationId,
      title: titleTrim,
    });
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

    const settings = this.settingsViewFromConv(conv.groupSettingsJson);
    const myRole = this.permissions.normalizeRole(me.role);
    const viewerCanModerate =
      myRole === ConversationMemberRole.owner ||
      myRole === ConversationMemberRole.admin;

    const activeMembers = conv.members.filter(
      (m) => m.status === ConversationMemberStatus.active,
    );
    const pendingMembersAll = conv.members.filter(
      (m) => m.status === ConversationMemberStatus.pending,
    );

    if (me.status === ConversationMemberStatus.pending) {
      return {
        conversationId: conv.id,
        title: conv.title,
        avatarUrl: conv.avatarUrl,
        createdById: conv.createdById,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        myRole,
        myStatus: me.status,
        settings,
        members: [],
        pendingMembers: [],
      };
    }

    const members: GroupMemberView[] = activeMembers.map((m) =>
      this.toMemberView(m),
    );

    const pendingMembers: GroupMemberView[] = viewerCanModerate
      ? pendingMembersAll.map((m) => this.toMemberView(m))
      : [];

    return {
      conversationId: conv.id,
      title: conv.title,
      avatarUrl: conv.avatarUrl,
      createdById: conv.createdById,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      myRole,
      myStatus: me.status,
      settings,
      members,
      pendingMembers,
    };
  }

  async updateGroupSettings(
    actorId: string,
    conversationId: string,
    dto: UpdateGroupSettingsDto,
  ): Promise<{ group: GroupDetailView }> {
    const member = await this.membership.requireActiveMember(actorId, conversationId);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);
    this.permissions.assertCanUpdateGroupSettings(member.role);

    const patch: Partial<{
      onlyAdminsCanPost: boolean;
      joinApprovalRequired: boolean;
      onlyAdminsCanAddMembers: boolean;
      onlyAdminsCanRemoveMembers: boolean;
      moderatorsCanRecallMessages: boolean;
    }> = {};
    if (dto.onlyAdminsCanPost !== undefined) {
      patch.onlyAdminsCanPost = dto.onlyAdminsCanPost;
    }
    if (dto.joinApprovalRequired !== undefined) {
      patch.joinApprovalRequired = dto.joinApprovalRequired;
    }
    if (dto.onlyAdminsCanAddMembers !== undefined) {
      patch.onlyAdminsCanAddMembers = dto.onlyAdminsCanAddMembers;
    }
    if (dto.onlyAdminsCanRemoveMembers !== undefined) {
      patch.onlyAdminsCanRemoveMembers = dto.onlyAdminsCanRemoveMembers;
    }
    if (dto.moderatorsCanRecallMessages !== undefined) {
      patch.moderatorsCanRecallMessages = dto.moderatorsCanRecallMessages;
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No settings provided');
    }

    const merged = mergeGroupSettingsPatch(conv.groupSettingsJson, patch);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { groupSettingsJson: merged },
    });

    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async updateGroup(
    actorId: string,
    conversationId: string,
    dto: UpdateGroupDto,
  ): Promise<{ group: GroupDetailView }> {
    if (dto.title === undefined && dto.avatarUrl === undefined) {
      throw new BadRequestException('Provide title and/or avatarUrl');
    }

    const member = await this.membership.requireActiveMember(actorId, conversationId);

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

    await this.publishSystemMessages(conversationId, newSystemMessageIds);

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
    const member = await this.membership.requireActiveMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const settings = parseGroupSettings(conv.groupSettingsJson);
    this.permissions.assertMayAddMembers(member.role, settings);

    const activeUserIds = new Set(
      conv.members
        .filter((m) => m.status === ConversationMemberStatus.active)
        .map((m) => m.userId),
    );
    const pendingByUser = new Map(
      conv.members
        .filter((m) => m.status === ConversationMemberStatus.pending)
        .map((m) => [m.userId, m]),
    );

    const uniqueIncoming = [...new Set(dto.memberIds)];
    const toInvite = uniqueIncoming.filter(
      (id) => !activeUserIds.has(id) && !pendingByUser.has(id),
    );

    if (toInvite.length === 0) {
      const group = await this.getGroupDetailForMember(actorId, conversationId);
      return { group };
    }

    await this.assertTargetsInvitable(actorId, toInvite);

    const status = settings.joinApprovalRequired
      ? ConversationMemberStatus.pending
      : ConversationMemberStatus.active;

    let systemMessageId: string | null = null;
    const activatedUserIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.createMany({
        data: toInvite.map((userId) => ({
          conversationId,
          userId,
          role: ConversationMemberRole.member,
          status,
        })),
      });

      if (status === ConversationMemberStatus.active) {
        activatedUserIds.push(...toInvite);
        const actorName = await this.displayName(tx, actorId);
        const addedUsers = await tx.user.findMany({ where: { id: { in: toInvite } } });
        const names = addedUsers.map((u) => u.displayName).filter(Boolean);
        const content = `${actorName} added ${this.joinDisplayNames(names)}`;

        const msg = await this.appendSystemMessage(tx, {
          conversationId,
          actorId,
          content,
          metadata: {
            kind: 'members_added',
            actorId,
            addedUserIds: toInvite,
          },
        });
        systemMessageId = msg.id;
      }
    });

    if (systemMessageId) {
      await this.publishSystemMessages(conversationId, [systemMessageId]);
    }

    if (activatedUserIds.length > 0) {
      this.domainEvents.emit({
        type: 'group.member_added',
        conversationId,
        userIds: activatedUserIds,
      });
    }

    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    const group = await this.getGroupDetailForMember(actorId, conversationId);
    return { group };
  }

  async approveMember(
    actorId: string,
    conversationId: string,
    targetUserId: string,
  ): Promise<{ group: GroupDetailView }> {
    const actorMember = await this.membership.requireActiveMember(actorId, conversationId);
    const actorRole = this.permissions.normalizeRole(actorMember.role);
    if (
      actorRole !== ConversationMemberRole.owner &&
      actorRole !== ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const target = conv.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('User is not in this group');
    }
    if (target.status !== ConversationMemberStatus.pending) {
      throw new BadRequestException('User is not pending approval');
    }

    let systemMessageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: targetUserId },
        },
        data: { status: ConversationMemberStatus.active },
      });

      const actorName = await this.displayName(tx, actorId);
      const targetName = await this.displayName(tx, targetUserId);
      const content = `${actorName} approved ${targetName} to join the group`;
      const msg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content,
        metadata: {
          kind: 'member_approved',
          approvedUserId: targetUserId,
        },
      });
      systemMessageId = msg.id;
    });

    if (systemMessageId) {
      await this.publishSystemMessages(conversationId, [systemMessageId]);
    }

    this.domainEvents.emit({
      type: 'group.member_added',
      conversationId,
      userIds: [targetUserId],
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async rejectMember(
    actorId: string,
    conversationId: string,
    targetUserId: string,
  ): Promise<{ group: GroupDetailView }> {
    const actorMember = await this.membership.requireActiveMember(actorId, conversationId);
    const actorRole = this.permissions.normalizeRole(actorMember.role);
    if (
      actorRole !== ConversationMemberRole.owner &&
      actorRole !== ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const target = conv.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('User is not in this group');
    }
    if (target.status !== ConversationMemberStatus.pending) {
      throw new BadRequestException('User is not pending approval');
    }

    await this.prisma.conversationMember.delete({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
    });

    this.domainEvents.emit({
      type: 'group.member_removed',
      conversationId,
      userId: targetUserId,
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async updateMemberRole(
    actorId: string,
    conversationId: string,
    targetUserId: string,
    dto: UpdateGroupMemberRoleDto,
  ): Promise<{ group: GroupDetailView }> {
    const actorMember = await this.membership.requireActiveMember(actorId, conversationId);
    this.permissions.assertOwnerMayAssignRoles(actorMember.role);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const target = conv.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('User is not in this group');
    }
    if (target.status !== ConversationMemberStatus.active) {
      throw new BadRequestException('Can only change roles for active members');
    }
    if (this.permissions.normalizeRole(target.role) === ConversationMemberRole.owner) {
      throw new BadRequestException('Use transfer ownership to change the group owner');
    }

    const nextRole = dto.role;
    if (
      nextRole !== ConversationMemberRole.admin &&
      nextRole !== ConversationMemberRole.member
    ) {
      throw new BadRequestException('Role must be admin or member');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: targetUserId },
        },
        data: { role: nextRole },
      });
      await this.appendAuditLog(tx, {
        conversationId,
        actorUserId: actorId,
        action: 'member_role_updated',
        targetUserId,
        payload: { role: nextRole },
      });
    });

    this.domainEvents.emit({
      type: 'group.member_role_updated',
      conversationId,
      actorUserId: actorId,
      userId: targetUserId,
      role: nextRole,
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async transferOwnership(
    actorId: string,
    conversationId: string,
    dto: TransferGroupOwnershipDto,
  ): Promise<{ group: GroupDetailView }> {
    const actorMember = await this.membership.requireActiveMember(actorId, conversationId);
    if (this.permissions.normalizeRole(actorMember.role) !== ConversationMemberRole.owner) {
      throw new ForbiddenException('Only the group owner can transfer ownership');
    }

    if (dto.newOwnerUserId === actorId) {
      throw new BadRequestException('You are already the owner');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const target = conv.members.find((m) => m.userId === dto.newOwnerUserId);
    if (!target || target.status !== ConversationMemberStatus.active) {
      throw new NotFoundException('New owner must be an active member');
    }

    const messageIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: { role: ConversationMemberRole.admin },
      });
      await tx.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: dto.newOwnerUserId,
          },
        },
        data: { role: ConversationMemberRole.owner },
      });

      const fromName = await this.displayName(tx, actorId);
      const toName = await this.displayName(tx, dto.newOwnerUserId);
      const transferContent = `${fromName} transferred ownership to ${toName}`;
      const transferMsg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content: transferContent,
        metadata: {
          kind: 'ownership_transferred',
          fromUserId: actorId,
          toUserId: dto.newOwnerUserId,
        },
      });
      messageIds.push(transferMsg.id);
      await this.appendAuditLog(tx, {
        conversationId,
        actorUserId: actorId,
        action: 'ownership_transferred',
        targetUserId: dto.newOwnerUserId,
        payload: { fromUserId: actorId, toUserId: dto.newOwnerUserId },
      });
    });

    await this.publishSystemMessages(conversationId, messageIds);

    this.domainEvents.emit({
      type: 'group.ownership_transferred',
      conversationId,
      actorUserId: actorId,
      toUserId: dto.newOwnerUserId,
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async dissolveGroup(
    actorId: string,
    conversationId: string,
  ): Promise<{ dissolved: true }> {
    const member = await this.membership.requireActiveMember(actorId, conversationId);
    if (this.permissions.normalizeRole(member.role) !== ConversationMemberRole.owner) {
      throw new ForbiddenException('Only the group owner can dissolve the group');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    await this.softDissolveGroupConversation(conversationId, actorId);

    return { dissolved: true };
  }

  async removeMember(
    actorId: string,
    conversationId: string,
    targetUserId: string,
  ): Promise<{ group: GroupDetailView }> {
    if (actorId === targetUserId) {
      throw new ForbiddenException('Use POST /groups/:id/leave to leave the group');
    }

    const actorMember = await this.membership.requireActiveMember(actorId, conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const settings = parseGroupSettings(conv.groupSettingsJson);
    this.permissions.assertMayRemoveMembers(actorMember.role, settings);

    const target = conv.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('User is not in this group');
    }

    if (target.status === ConversationMemberStatus.pending) {
      await this.prisma.conversationMember.delete({
        where: {
          conversationId_userId: {
            conversationId,
            userId: targetUserId,
          },
        },
      });
      this.domainEvents.emit({
        type: 'group.member_removed',
        conversationId,
        userId: targetUserId,
      });
      this.domainEvents.emit({
        type: 'group.updated',
        conversationId,
        payload: {},
      });
      return { group: await this.getGroupDetailForMember(actorId, conversationId) };
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
      await this.publishSystemMessages(conversationId, [systemMessageId]);
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

    if (member.status === ConversationMemberStatus.pending) {
      await this.prisma.conversationMember.delete({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });
      this.domainEvents.emit({
        type: 'group.member_removed',
        conversationId,
        userId: actorId,
      });
      return { left: true };
    }

    const actorRole = this.permissions.normalizeRole(member.role);
    const othersActive = conv.members.filter(
      (m) =>
        m.userId !== actorId && m.status === ConversationMemberStatus.active,
    );

    if (actorRole === ConversationMemberRole.owner) {
      if (othersActive.length === 0) {
        await this.softDissolveGroupConversation(conversationId, actorId);
        return { left: true };
      }

      const successor = this.pickOwnershipSuccessor(othersActive);

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

      await this.publishSystemMessages(conversationId, ownerLeaveMessageIds);

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
      await this.publishSystemMessages(conversationId, [systemMessageId]);
    }

    this.domainEvents.emit({
      type: 'group.member_removed',
      conversationId,
      userId: actorId,
    });

    return { left: true };
  }

  /**
   * User-initiated join when `joinApprovalRequired` is on (no membership row until approved).
   */
  async createSelfJoinRequest(
    applicantId: string,
    conversationId: string,
  ): Promise<{ created: true }> {
    await this.membership.assertGroupConversationNotDissolved(conversationId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const settings = parseGroupSettings(conv.groupSettingsJson);
    if (!settings.joinApprovalRequired) {
      throw new BadRequestException(
        'This group does not require join approval; ask a member to add you instead',
      );
    }

    const alreadyMember = conv.members.some(
      (m) =>
        m.userId === applicantId &&
        m.status === ConversationMemberStatus.active,
    );
    if (alreadyMember) {
      throw new BadRequestException('You are already an active member of this group');
    }

    const invitedPending = conv.members.some(
      (m) =>
        m.userId === applicantId &&
        m.status === ConversationMemberStatus.pending,
    );
    if (invitedPending) {
      throw new BadRequestException(
        'You already have a pending invitation for this group; wait for approval',
      );
    }

    const pendingSelf = await this.prisma.groupJoinRequest.findFirst({
      where: {
        conversationId,
        userId: applicantId,
        status: GroupJoinRequestStatus.pending,
      },
    });
    if (pendingSelf) {
      throw new BadRequestException('You already have a pending join request');
    }

    await this.assertApplicantFriendsWithActiveMember(applicantId, conversationId);

    try {
      await this.prisma.groupJoinRequest.create({
        data: {
          conversationId,
          userId: applicantId,
          status: GroupJoinRequestStatus.pending,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('You already have a pending join request');
      }
      throw err;
    }

    this.domainEvents.emit({
      type: 'group.join_request_created',
      conversationId,
      userId: applicantId,
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { created: true };
  }

  async listJoinQueue(
    viewerId: string,
    conversationId: string,
  ): Promise<{
    items: Array<{
      kind: 'self_request' | 'invite_pending';
      userId: string;
      createdAt: Date;
    }>;
  }> {
    const actorMember = await this.membership.requireActiveMember(
      viewerId,
      conversationId,
    );
    const actorRole = this.permissions.normalizeRole(actorMember.role);
    if (
      actorRole !== ConversationMemberRole.owner &&
      actorRole !== ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      throw new NotFoundException('Group not found');
    }
    this.permissions.assertGroupConversation(conv.type);

    const selfRows = await this.prisma.groupJoinRequest.findMany({
      where: {
        conversationId,
        status: GroupJoinRequestStatus.pending,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const invitePending = conv.members.filter(
      (m) => m.status === ConversationMemberStatus.pending,
    );

    const items: Array<{
      kind: 'self_request' | 'invite_pending';
      userId: string;
      createdAt: Date;
    }> = [
      ...selfRows.map((r) => ({
        kind: 'self_request' as const,
        userId: r.userId,
        createdAt: r.createdAt,
      })),
      ...invitePending.map((m) => ({
        kind: 'invite_pending' as const,
        userId: m.userId,
        createdAt: m.joinedAt,
      })),
    ];

    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { items };
  }

  async approveJoinRequest(
    actorId: string,
    conversationId: string,
    applicantUserId: string,
  ): Promise<{ group: GroupDetailView }> {
    const actorMember = await this.membership.requireActiveMember(
      actorId,
      conversationId,
    );
    const actorRole = this.permissions.normalizeRole(actorMember.role);
    if (
      actorRole !== ConversationMemberRole.owner &&
      actorRole !== ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const req = await this.prisma.groupJoinRequest.findFirst({
      where: {
        conversationId,
        userId: applicantUserId,
        status: GroupJoinRequestStatus.pending,
      },
    });
    if (!req) {
      throw new NotFoundException('No pending self-join request for this user');
    }

    let systemMessageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.groupJoinRequest.update({
        where: { id: req.id },
        data: {
          status: GroupJoinRequestStatus.approved,
          resolvedAt: new Date(),
          resolvedByUserId: actorId,
        },
      });

      await tx.conversationMember.create({
        data: {
          conversationId,
          userId: applicantUserId,
          role: ConversationMemberRole.member,
          status: ConversationMemberStatus.active,
        },
      });

      const actorName = await this.displayName(tx, actorId);
      const targetName = await this.displayName(tx, applicantUserId);
      const content = `${actorName} approved ${targetName} to join the group`;
      const msg = await this.appendSystemMessage(tx, {
        conversationId,
        actorId,
        content,
        metadata: {
          kind: 'member_approved',
          approvedUserId: applicantUserId,
          source: 'self_join_request',
        },
      });
      systemMessageId = msg.id;
    });

    if (systemMessageId) {
      await this.publishSystemMessages(conversationId, [systemMessageId]);
    }

    this.domainEvents.emit({
      type: 'group.join_request_decided',
      conversationId,
      userId: applicantUserId,
      approved: true,
    });
    this.domainEvents.emit({
      type: 'group.member_added',
      conversationId,
      userIds: [applicantUserId],
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { group: await this.getGroupDetailForMember(actorId, conversationId) };
  }

  async rejectJoinRequest(
    actorId: string,
    conversationId: string,
    applicantUserId: string,
  ): Promise<{ ok: true }> {
    const actorMember = await this.membership.requireActiveMember(
      actorId,
      conversationId,
    );
    const actorRole = this.permissions.normalizeRole(actorMember.role);
    if (
      actorRole !== ConversationMemberRole.owner &&
      actorRole !== ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const req = await this.prisma.groupJoinRequest.findFirst({
      where: {
        conversationId,
        userId: applicantUserId,
        status: GroupJoinRequestStatus.pending,
      },
    });
    if (!req) {
      throw new NotFoundException('No pending self-join request for this user');
    }

    await this.prisma.groupJoinRequest.update({
      where: { id: req.id },
      data: {
        status: GroupJoinRequestStatus.rejected,
        resolvedAt: new Date(),
        resolvedByUserId: actorId,
      },
    });

    this.domainEvents.emit({
      type: 'group.join_request_decided',
      conversationId,
      userId: applicantUserId,
      approved: false,
    });
    this.domainEvents.emit({
      type: 'group.updated',
      conversationId,
      payload: {},
    });

    return { ok: true };
  }

  private async softDissolveGroupConversation(
    conversationId: string,
    actorUserId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id: conversationId },
        data: { dissolvedAt: new Date() },
      });
      await tx.conversationMember.deleteMany({ where: { conversationId } });
      await tx.groupJoinRequest.deleteMany({ where: { conversationId } });
      if (actorUserId) {
        await this.appendAuditLog(tx, {
          conversationId,
          actorUserId,
          action: 'group_dissolved',
        });
      }
    });

    this.domainEvents.emit({
      type: 'group.dissolved',
      conversationId,
      actorUserId,
    });
  }

  private async assertApplicantFriendsWithActiveMember(
    applicantId: string,
    conversationId: string,
  ): Promise<void> {
    const activeIds = (
      await this.prisma.conversationMember.findMany({
        where: {
          conversationId,
          status: ConversationMemberStatus.active,
        },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const targets = activeIds.filter((id) => id !== applicantId);
    if (targets.length === 0) {
      throw new BadRequestException('This group has no active members to vouch for you');
    }

    for (const tid of targets) {
      const rel = await this.friends.getRelationshipStatus(applicantId, tid);
      if (rel === 'friend') {
        return;
      }
    }

    throw new ForbiddenException(
      'You must be friends with at least one active member to request joining this group',
    );
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

  private async publishSystemMessages(
    conversationId: string,
    messageIds: string[],
  ): Promise<void> {
    for (const id of messageIds) {
      await this.messages.broadcastPersistedMessage(conversationId, id);
    }
  }

  private settingsViewFromConv(
    raw: Prisma.JsonValue | null | undefined,
  ): GroupSettingsView {
    const s = parseGroupSettings(raw);
    return {
      onlyAdminsCanPost: s.onlyAdminsCanPost,
      joinApprovalRequired: s.joinApprovalRequired,
      onlyAdminsCanAddMembers: s.onlyAdminsCanAddMembers,
      onlyAdminsCanRemoveMembers: s.onlyAdminsCanRemoveMembers,
      moderatorsCanRecallMessages: s.moderatorsCanRecallMessages,
    };
  }

  private toMemberView(m: {
    userId: string;
    role: ConversationMemberRole | null;
    status: ConversationMemberStatus;
    joinedAt: Date;
    user: User;
  }): GroupMemberView {
    return {
      userId: m.userId,
      role: this.permissions.normalizeRole(m.role),
      status: m.status,
      joinedAt: m.joinedAt,
      user: toPublicUserProfile(m.user),
    };
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
}
