import { ForbiddenException, Injectable } from '@nestjs/common';
import type { ConversationMember, Prisma } from '@prisma/client';
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
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
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
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    return member;
  }
}
