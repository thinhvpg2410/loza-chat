import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, type Message, type Prisma } from '@prisma/client';
import {
  isMessageAfter,
  maxMessageTimelineRef,
  type MessageTimelineRef,
} from '../../common/utils/message-timeline';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from './conversation-membership.service';
import { ConversationUnreadService } from './conversation-unread.service';
import type {
  ConversationMemberProgressPublic,
  ConversationStateView,
} from './types/conversation-views';

@Injectable()
export class ConversationProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
    private readonly unread: ConversationUnreadService,
  ) {}

  async getState(
    userId: string,
    conversationId: string,
  ): Promise<ConversationStateView> {
    await this.membership.requireActiveMember(userId, conversationId);
    return this.buildStateView(userId, conversationId);
  }

  async advanceDelivered(
    actorId: string,
    conversationId: string,
    explicitMessageId?: string,
  ): Promise<{ state: ConversationStateView; at: string }> {
    const at = new Date().toISOString();

    await this.prisma.$transaction(async (tx) => {
      await this.membership.requireActiveMemberTx(tx, actorId, conversationId);

      const target = await this.resolveProgressTargetTx(
        tx,
        conversationId,
        explicitMessageId,
      );
      if (!target) {
        return;
      }

      const member = await tx.conversationMember.findUniqueOrThrow({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });

      const currentDelivered = await this.loadMessageInConversationTx(
        tx,
        conversationId,
        member.lastDeliveredMessageId,
      );

      if (
        currentDelivered &&
        !isMessageAfter(target, currentDelivered) &&
        target.id !== currentDelivered.id
      ) {
        return;
      }

      if (currentDelivered && target.id === currentDelivered.id) {
        return;
      }

      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: { lastDeliveredMessageId: target.id },
      });
    });

    const state = await this.buildStateView(actorId, conversationId);
    return { state, at };
  }

  async advanceRead(
    actorId: string,
    conversationId: string,
    explicitMessageId?: string,
  ): Promise<{ state: ConversationStateView; at: string }> {
    const at = new Date().toISOString();

    await this.prisma.$transaction(async (tx) => {
      await this.membership.requireActiveMemberTx(tx, actorId, conversationId);

      const target = await this.resolveProgressTargetTx(
        tx,
        conversationId,
        explicitMessageId,
      );
      if (!target) {
        return;
      }

      const member = await tx.conversationMember.findUniqueOrThrow({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });

      const currentRead = await this.loadMessageInConversationTx(
        tx,
        conversationId,
        member.lastReadMessageId,
      );

      if (
        currentRead &&
        !isMessageAfter(target, currentRead) &&
        target.id !== currentRead.id
      ) {
        return;
      }

      if (currentRead && target.id === currentRead.id) {
        return;
      }

      const currentDelivered = await this.loadMessageInConversationTx(
        tx,
        conversationId,
        member.lastDeliveredMessageId,
      );

      const targetRef: MessageTimelineRef = {
        createdAt: target.createdAt,
        id: target.id,
      };
      const deliveredRef = currentDelivered
        ? { createdAt: currentDelivered.createdAt, id: currentDelivered.id }
        : null;
      const winner = maxMessageTimelineRef(deliveredRef, targetRef);
      const newDeliveredId = winner?.id ?? target.id;

      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: {
          lastReadMessageId: target.id,
          lastDeliveredMessageId: newDeliveredId,
        },
      });
    });

    const state = await this.buildStateView(actorId, conversationId);
    return { state, at };
  }

  /**
   * Resolves the message used for read/delivered progression. Throws if an
   * explicit id is invalid; returns null when omitted and the thread is empty.
   */
  private async resolveProgressTargetTx(
    tx: Prisma.TransactionClient,
    conversationId: string,
    explicitMessageId?: string,
  ): Promise<Message | null> {
    if (explicitMessageId) {
      const row = await tx.message.findFirst({
        where: {
          id: explicitMessageId,
          conversationId,
          deletedAt: null,
        },
      });
      if (!row) {
        throw new NotFoundException('Message not found in this conversation');
      }
      return row;
    }

    return tx.message.findFirst({
      where: { conversationId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  private async loadMessageInConversationTx(
    tx: Prisma.TransactionClient,
    conversationId: string,
    messageId: string | null,
  ): Promise<Message | null> {
    if (!messageId) {
      return null;
    }
    return tx.message.findFirst({
      // Keep monotonic progression even when a pointed message was later recalled/deleted.
      where: { id: messageId, conversationId },
    });
  }

  private async buildStateView(
    userId: string,
    conversationId: string,
  ): Promise<ConversationStateView> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const meRow = conversation.members.find((m) => m.userId === userId);
    if (!meRow) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const peerRow =
      conversation.type === ConversationType.direct
        ? (conversation.members.find((m) => m.userId !== userId) ?? null)
        : null;

    const me: ConversationMemberProgressPublic = {
      userId,
      lastReadMessageId: meRow.lastReadMessageId,
      lastDeliveredMessageId: meRow.lastDeliveredMessageId,
    };

    const peer: ConversationMemberProgressPublic | null = peerRow
      ? {
          userId: peerRow.userId,
          lastReadMessageId: peerRow.lastReadMessageId,
          lastDeliveredMessageId: peerRow.lastDeliveredMessageId,
        }
      : null;

    const unreadCount = await this.unread.countForConversation(
      userId,
      conversationId,
    );

    return {
      conversationId: conversation.id,
      type: conversation.type,
      updatedAt: conversation.updatedAt,
      lastMessageId: conversation.lastMessageId,
      me,
      peer,
      unreadCount,
    };
  }
}
