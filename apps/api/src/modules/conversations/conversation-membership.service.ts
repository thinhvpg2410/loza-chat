import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ConversationMember, Prisma } from '@prisma/client';
import { ConversationMemberStatus, ConversationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConversationMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the user is a member of the conversation. Use for every read/write to messages or conversation details.
   */
  async requireMember(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMember> {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        conversation: { select: { type: true, dissolvedAt: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    this.assertGroupNotDissolved(member.conversation);
    return member;
  }

  /**
   * Group: pending members are not allowed to use messaging, receipts, or socket rooms.
   * Direct threads always treat membership as active.
   */
  async requireActiveMember(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMember> {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        conversation: { select: { type: true, dissolvedAt: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    this.assertGroupNotDissolved(member.conversation);
    if (
      member.conversation.type === ConversationType.group &&
      member.status !== ConversationMemberStatus.active
    ) {
      throw new ForbiddenException('Your membership in this group is not active yet');
    }
    return member;
  }

  async requireActiveMemberTx(
    tx: Prisma.TransactionClient,
    userId: string,
    conversationId: string,
  ): Promise<ConversationMember> {
    const member = await this.requireMemberTx(tx, userId, conversationId);
    const conv = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true, dissolvedAt: true },
    });
    this.assertGroupNotDissolved(conv);
    if (conv?.type === ConversationType.group && member.status !== ConversationMemberStatus.active) {
      throw new ForbiddenException('Your membership in this group is not active yet');
    }
    return member;
  }

  /**
   * Same as {@link requireMember} but participates in an interactive transaction.
   */
  async requireMemberTx(
    tx: Prisma.TransactionClient,
    userId: string,
    conversationId: string,
  ): Promise<ConversationMember> {
    const member = await tx.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        conversation: { select: { type: true, dissolvedAt: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    this.assertGroupNotDissolved(member.conversation);
    return member;
  }

  /**
   * Used when the caller is not yet a member (e.g. self-join request) but must not target a dead group.
   */
  async assertGroupConversationNotDissolved(conversationId: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true, dissolvedAt: true },
    });
    if (!conv || conv.type !== ConversationType.group) {
      throw new NotFoundException('Group not found');
    }
    this.assertGroupNotDissolved(conv);
  }

  private assertGroupNotDissolved(
    conv: { type: ConversationType; dissolvedAt: Date | null } | null,
  ): void {
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }
    if (conv.type === ConversationType.group && conv.dissolvedAt) {
      throw new ForbiddenException('This group has been dissolved');
    }
  }
}
