import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ConversationType,
  MessageType,
  Prisma,
  type Attachment,
  type Message,
  type User,
} from '@prisma/client';
import { toAttachmentPublicDto } from '../../common/mappers/attachment-public.mapper';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import {
  decodeMessageCursor,
  encodeMessageCursor,
} from '../../common/utils/message-cursor';
import { isRefAtOrAfterMessage } from '../../common/utils/message-timeline';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { UploadRulesService } from '../uploads/upload-rules.service';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';
import type { SendMessageWithAttachmentsDto } from './dto/send-message-with-attachments.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import type { MessageView, MessageWithReceiptStateView } from './types/message-view';

type MessageWithRelations = Message & {
  sender: User;
  attachments: Attachment[];
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
    private readonly uploadRules: UploadRulesService,
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
        include: {
          sender: true,
          attachments: { orderBy: { sortOrder: 'asc' } },
        },
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
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
          },
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
            include: {
              sender: true,
              attachments: { orderBy: { sortOrder: 'asc' } },
            },
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

  async sendMessageWithAttachments(
    senderId: string,
    dto: SendMessageWithAttachmentsDto,
  ): Promise<{ message: MessageView }> {
    this.uploadRules.assertAttachmentIdsForMessageType(
      dto.type,
      dto.attachmentIds.length,
    );

    const content =
      dto.content !== undefined && dto.content.length > 0 ? dto.content : null;

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
        include: {
          sender: true,
          attachments: { orderBy: { sortOrder: 'asc' } },
        },
      });

      if (existing) {
        return { message: this.toMessageView(existing), created: false };
      }

      const attachments = await tx.attachment.findMany({
        where: {
          id: { in: dto.attachmentIds },
          uploadedById: senderId,
          messageId: null,
        },
      });

      if (attachments.length !== dto.attachmentIds.length) {
        throw new BadRequestException(
          'One or more attachments are missing, not owned by you, or already used',
        );
      }

      const byId = new Map(attachments.map((a) => [a.id, a]));
      const ordered = dto.attachmentIds.map((id) => {
        const row = byId.get(id);
        if (!row) {
          throw new BadRequestException('Invalid attachment ordering');
        }
        return row;
      });

      this.uploadRules.assertAttachmentsMatchMessageType(
        dto.type,
        ordered.map((a) => a.attachmentType),
      );

      try {
        const created = await tx.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
            type: dto.type,
            content,
            replyToMessageId: dto.replyToMessageId ?? null,
          },
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
          },
        });

        for (let i = 0; i < dto.attachmentIds.length; i++) {
          await tx.attachment.update({
            where: { id: dto.attachmentIds[i] },
            data: {
              messageId: created.id,
              conversationId: dto.conversationId,
              sortOrder: i,
            },
          });
        }

        await tx.conversation.update({
          where: { id: dto.conversationId },
          data: { lastMessageId: created.id },
        });

        const withAtt = await tx.message.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
          },
        });

        return { message: this.toMessageView(withAtt), created: true };
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
            include: {
              sender: true,
              attachments: { orderBy: { sortOrder: 'asc' } },
            },
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
  ): Promise<{
    messages: MessageWithReceiptStateView[];
    nextCursor: string | null;
  }> {
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

    const [rows, conversationMeta] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        include: {
          sender: true,
          attachments: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true },
      }),
    ]);

    const page = rows.slice(0, limit);

    const peerMember =
      conversationMeta?.type === ConversationType.direct
        ? (conversationMeta.members.find((m) => m.userId !== viewerId) ?? null)
        : null;

    const markerIds = [
      peerMember?.lastReadMessageId,
      peerMember?.lastDeliveredMessageId,
    ].filter((id): id is string => Boolean(id));

    const markerRows =
      markerIds.length === 0
        ? []
        : await this.prisma.message.findMany({
            where: {
              conversationId,
              deletedAt: null,
              id: { in: markerIds },
            },
          });

    const markerById = new Map(markerRows.map((m) => [m.id, m]));

    const peerReadRef = peerMember?.lastReadMessageId
      ? (markerById.get(peerMember.lastReadMessageId) ?? null)
      : null;
    const peerDeliveredRef = peerMember?.lastDeliveredMessageId
      ? (markerById.get(peerMember.lastDeliveredMessageId) ?? null)
      : null;

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
      messages: page.map((m) => {
        const base = this.toMessageView(m);
        const sentByViewer = m.senderId === viewerId;
        const timelineRef = { createdAt: m.createdAt, id: m.id };
        return {
          ...base,
          sentByViewer,
          deliveredToPeer:
            sentByViewer &&
            isRefAtOrAfterMessage(peerDeliveredRef, timelineRef),
          seenByPeer:
            sentByViewer && isRefAtOrAfterMessage(peerReadRef, timelineRef),
        };
      }),
      nextCursor,
    };
  }

  private toMessageView(row: MessageWithRelations): MessageView {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      clientMessageId: row.clientMessageId,
      type: row.type,
      content: row.content,
      metadataJson: row.metadataJson ?? null,
      replyToMessageId: row.replyToMessageId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: toPublicUserProfile(row.sender),
      attachments: row.attachments.map((a) => toAttachmentPublicDto(a)),
    };
  }
}
