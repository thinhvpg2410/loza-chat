import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConversationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { GroupPermissionsService } from './group-permissions.service';
import { parseGroupSettings } from './group-settings.util';

/**
 * Enforces group posting rules (active membership + onlyAdminsCanPost). No-op for direct threads.
 */
@Injectable()
export class GroupPostPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
    private readonly permissions: GroupPermissionsService,
  ) {}

  async assertUserMaySendMessage(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const member = await this.membership.requireActiveMember(userId, conversationId);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true, groupSettingsJson: true, dissolvedAt: true },
    });
    if (!conv || conv.type !== ConversationType.group) {
      return;
    }
    if (conv.dissolvedAt) {
      throw new ForbiddenException('This group has been dissolved');
    }
    const settings = parseGroupSettings(conv.groupSettingsJson);
    this.permissions.assertMayPostGroupMessage(member.role, settings);
  }
}
