import { Injectable, NotFoundException } from '@nestjs/common';
import type { Message, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';

export interface ReceiptBroadcastPayload {
  conversationId: string;
  userId: string;
  messageId: string;
  at: string;
}

@Injectable()
export class MessageReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
  ) {}

  async markDelivered(
    actorId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ReceiptBroadcastPayload> {
    await this.membership.requireMember(actorId, conversationId);

    const at = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findFirst({
        where: { id: messageId, conversationId, deletedAt: null },
      });
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      const member = await tx.conversationMember.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });
      if (!member) {
        throw new NotFoundException('Membership not found');
      }

      const advance = await this.shouldAdvancePointer(
        tx,
        member.lastDeliveredMessageId,
        message,
      );
      if (!advance) {
        const effectiveId = member.lastDeliveredMessageId ?? messageId;
        return {
          conversationId,
          userId: actorId,
          messageId: effectiveId,
          at: at.toISOString(),
        };
      }

      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: { lastDeliveredMessageId: messageId },
      });

      return {
        conversationId,
        userId: actorId,
        messageId,
        at: at.toISOString(),
      };
    });

    return result;
  }

  async markSeen(
    actorId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ReceiptBroadcastPayload> {
    await this.membership.requireMember(actorId, conversationId);

    const at = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findFirst({
        where: { id: messageId, conversationId, deletedAt: null },
      });
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      const member = await tx.conversationMember.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
      });
      if (!member) {
        throw new NotFoundException('Membership not found');
      }

      const advance = await this.shouldAdvancePointer(
        tx,
        member.lastReadMessageId,
        message,
      );
      if (!advance) {
        const effectiveId = member.lastReadMessageId ?? messageId;
        return {
          conversationId,
          userId: actorId,
          messageId: effectiveId,
          at: at.toISOString(),
        };
      }

      await tx.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: actorId },
        },
        data: { lastReadMessageId: messageId },
      });

      return {
        conversationId,
        userId: actorId,
        messageId,
        at: at.toISOString(),
      };
    });

    return result;
  }

  private async shouldAdvancePointer(
    tx: Prisma.TransactionClient,
    currentPointerId: string | null,
    candidate: Message,
  ): Promise<boolean> {
    if (!currentPointerId) {
      return true;
    }

    const current = await tx.message.findUnique({
      where: { id: currentPointerId },
    });

    if (!current || current.conversationId !== candidate.conversationId) {
      return true;
    }

    return this.isMessageAfter(candidate, current);
  }

  private isMessageAfter(a: Message, b: Message): boolean {
    if (a.createdAt > b.createdAt) {
      return true;
    }
    if (a.createdAt < b.createdAt) {
      return false;
    }
    return a.id > b.id;
  }
}
