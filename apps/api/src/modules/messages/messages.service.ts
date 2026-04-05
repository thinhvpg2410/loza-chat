import { BadRequestException, Injectable } from '@nestjs/common';
import { MessageType, Prisma, type Message, type User } from '@prisma/client';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import {
  decodeMessageCursor,
  encodeMessageCursor,
} from '../../common/utils/message-cursor';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import type { MessageView } from './types/message-view';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
  ) {}

  async sendTextMessage(
    senderId: string,
    dto: SendMessageDto,
  ): Promise<{
    message: MessageView;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.membership.requireMemberTx(tx, senderId, dto.conversationId);

      if (dto.replyToMessageId) {
        const parent = await tx.message.findFirst({
          where: {
            id: dto.replyToMessageId,
            conversationId: dto.conversationId,
            deletedAt: null,
          },
        });
        if (!parent) {
          throw new BadRequestException(
            'Reply target not found in this conversation',
          );
        }
      }

      const existing = await tx.message.findUnique({
        where: {
          conversationId_senderId_clientMessageId: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
          },
        },
        include: { sender: true },
      });

      if (existing) {
        return { message: this.toMessageView(existing), created: false };
      }

      try {
        const created = await tx.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
            type: MessageType.text,
            content: dto.content,
            replyToMessageId: dto.replyToMessageId ?? null,
          },
          include: { sender: true },
        });

        await tx.conversation.update({
          where: { id: dto.conversationId },
          data: { lastMessageId: created.id },
        });

        return { message: this.toMessageView(created), created: true };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const again = await tx.message.findUnique({
            where: {
              conversationId_senderId_clientMessageId: {
                conversationId: dto.conversationId,
                senderId,
                clientMessageId: dto.clientMessageId,
              },
            },
            include: { sender: true },
          });
          if (again) {
            return { message: this.toMessageView(again), created: false };
          }
        }
        throw err;
      }
    });

    return { message: result.message };
  }

  /**
   * Messages are returned **newest first**. Use `nextCursor` to load **older** messages.
   */
  async listMessagesForConversation(
    viewerId: string,
    conversationId: string,
    query: MessageHistoryQueryDto,
  ): Promise<{ messages: MessageView[]; nextCursor: string | null }> {
    await this.membership.requireMember(viewerId, conversationId);

    const limit = MessageHistoryQueryDto.resolveLimit(query.limit);
    const cursorPayload = query.cursor
      ? decodeMessageCursor(query.cursor)
      : null;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      deletedAt: null,
      ...(cursorPayload
        ? {
            OR: [
              { createdAt: { lt: new Date(cursorPayload.createdAt) } },
              {
                AND: [
                  { createdAt: { equals: new Date(cursorPayload.createdAt) } },
                  { id: { lt: cursorPayload.id } },
                ],
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { sender: true },
    });

    const page = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const oldestInPage = page.length > 0 ? page[page.length - 1] : null;
    const nextCursor =
      hasMore && oldestInPage
        ? encodeMessageCursor({
            createdAt: oldestInPage.createdAt.toISOString(),
            id: oldestInPage.id,
          })
        : null;

    return {
      messages: page.map((m) => this.toMessageView(m)),
      nextCursor,
    };
  }

  private toMessageView(row: Message & { sender: User }): MessageView {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      clientMessageId: row.clientMessageId,
      type: row.type,
      content: row.content,
      replyToMessageId: row.replyToMessageId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: toPublicUserProfile(row.sender),
    };
  }
}
