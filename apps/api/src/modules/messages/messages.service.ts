import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  Prisma,
  type Attachment,
  type Message,
  type Sticker,
  type StickerPack,
  type User,
} from '@prisma/client';
import type { AppConfiguration } from '../../config/configuration';
import { publicMediaUrlForStorageKey } from '../../common/media/public-media-url';
import { toAttachmentPublicDto } from '../../common/mappers/attachment-public.mapper';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import {
  decodeMessageCursor,
  encodeMessageCursor,
} from '../../common/utils/message-cursor';
import { isRefAtOrAfterMessage } from '../../common/utils/message-timeline';
import { PrismaService } from '../../prisma/prisma.service';
import { toStickerPublicDto } from '../stickers/mappers/sticker-public.mapper';
import { StickersService } from '../stickers/stickers.service';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { ConversationsService } from '../conversations/conversations.service';
import { GroupPermissionsService } from '../groups/group-permissions.service';
import { GroupPostPolicyService } from '../groups/group-post-policy.service';
import { parseGroupSettings } from '../groups/group-settings.util';
import { UploadRulesService } from '../uploads/upload-rules.service';
import { isAllowedReaction } from './constants/reaction-allowlist';
import { MessageDomainEventsService } from './message-domain-events.service';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';
import type { SendMessageWithAttachmentsDto } from './dto/send-message-with-attachments.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import type { SendStickerMessageDto } from './dto/send-sticker-message.dto';
import type {
  MessageView,
  MessageWithReceiptStateView,
  ReactionSummaryView,
} from './types/message-view';

type MessageWithRelations = Message & {
  sender: User;
  attachments: Attachment[];
  sticker?: (Sticker & { pack: StickerPack }) | null;
};

type MessageDeletionMode = 'recalled' | 'deleted';

type ForwardedMessageMeta = { forwardedFromMessageId: string };

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: ConversationMembershipService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversations: ConversationsService,
    private readonly groupPostPolicy: GroupPostPolicyService,
    private readonly groupPermissions: GroupPermissionsService,
    private readonly uploadRules: UploadRulesService,
    private readonly stickers: StickersService,
    private readonly domainEvents: MessageDomainEventsService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  /**
   * Used when group system messages are created outside this service (still persisted in `messages`).
   */
  async broadcastPersistedMessage(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const row = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      include: {
        sender: true,
        attachments: { orderBy: { sortOrder: 'asc' } },
        sticker: { include: { pack: true } },
      },
    });
    if (!row) {
      return;
    }
    const reactionMap = await this.buildReactionSummariesForMessages(
      row.senderId,
      [row.id],
    );
    const message = this.toMessageView(row, reactionMap.get(row.id));
    this.domainEvents.emit({
      type: 'message.created',
      conversationId,
      message,
    });
  }

  private parseDeletionMode(
    metadata: Prisma.JsonValue | null,
  ): MessageDeletionMode | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }
    const lifecycle = (metadata as Record<string, unknown>).messageLifecycle;
    if (!lifecycle || typeof lifecycle !== 'object' || Array.isArray(lifecycle)) {
      return null;
    }
    const mode = (lifecycle as Record<string, unknown>).deletionMode;
    return mode === 'recalled' || mode === 'deleted' ? mode : null;
  }

  private buildDeletionMetadata(
    existing: Prisma.JsonValue | null,
    mode: MessageDeletionMode,
    actorId: string,
    at: Date,
  ): Prisma.InputJsonValue {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? ({ ...(existing as Prisma.JsonObject) } as Prisma.JsonObject)
        : ({} as Prisma.JsonObject);

    base.messageLifecycle = {
      deletionMode: mode,
      deletedByUserId: actorId,
      deletedAt: at.toISOString(),
    };

    return base as Prisma.InputJsonValue;
  }

  private forwardedMetadataJson(
    forwardMeta?: ForwardedMessageMeta,
  ): Prisma.InputJsonValue | undefined {
    if (!forwardMeta?.forwardedFromMessageId) {
      return undefined;
    }
    return {
      forwardedFrom: {
        messageId: forwardMeta.forwardedFromMessageId,
      },
    } as Prisma.InputJsonValue;
  }

  async sendTextMessage(
    senderId: string,
    dto: SendMessageDto,
    forwardMeta?: ForwardedMessageMeta,
  ): Promise<{
    message: MessageView;
  }> {
    await this.conversations.assertMaySendDirectMessage(senderId, dto.conversationId);
    await this.groupPostPolicy.assertUserMaySendMessage(senderId, dto.conversationId);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.membership.requireActiveMemberTx(tx, senderId, dto.conversationId);

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
          sticker: { include: { pack: true } },
        },
      });

      if (existing) {
        return { message: this.toMessageView(existing), created: false };
      }

      try {
        const metadataJson = this.forwardedMetadataJson(forwardMeta);
        const created = await tx.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
            type: MessageType.text,
            content: dto.content,
            replyToMessageId: dto.replyToMessageId ?? null,
            ...(metadataJson ? { metadataJson } : {}),
          },
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
            sticker: { include: { pack: true } },
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
              sticker: { include: { pack: true } },
            },
          });
          if (again) {
            return { message: this.toMessageView(again), created: false };
          }
        }
        throw err;
      }
    });

    if (result.created) {
      this.domainEvents.emit({
        type: 'message.created',
        conversationId: dto.conversationId,
        message: result.message,
      });
    }

    return { message: result.message };
  }

  async sendStickerMessage(
    senderId: string,
    dto: SendStickerMessageDto,
    forwardMeta?: ForwardedMessageMeta,
  ): Promise<{ message: MessageView }> {
    await this.stickers.requireSendableSticker(dto.stickerId);
    await this.conversations.assertMaySendDirectMessage(senderId, dto.conversationId);
    await this.groupPostPolicy.assertUserMaySendMessage(senderId, dto.conversationId);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.membership.requireActiveMemberTx(tx, senderId, dto.conversationId);

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
          sticker: { include: { pack: true } },
        },
      });

      if (existing) {
        return { message: this.toMessageView(existing), created: false };
      }

      try {
        const metadataJson = this.forwardedMetadataJson(forwardMeta);
        const created = await tx.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
            type: MessageType.sticker,
            content: null,
            stickerId: dto.stickerId,
            replyToMessageId: dto.replyToMessageId ?? null,
            ...(metadataJson ? { metadataJson } : {}),
          },
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
            sticker: { include: { pack: true } },
          },
        });

        await tx.conversation.update({
          where: { id: dto.conversationId },
          data: { lastMessageId: created.id },
        });

        await tx.userRecentSticker.upsert({
          where: {
            userId_stickerId: {
              userId: senderId,
              stickerId: dto.stickerId,
            },
          },
          create: {
            userId: senderId,
            stickerId: dto.stickerId,
            lastUsedAt: new Date(),
            useCount: 1,
          },
          update: {
            lastUsedAt: new Date(),
            useCount: { increment: 1 },
          },
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
              sticker: { include: { pack: true } },
            },
          });
          if (again) {
            return { message: this.toMessageView(again), created: false };
          }
        }
        throw err;
      }
    });

    if (result.created) {
      this.domainEvents.emit({
        type: 'message.created',
        conversationId: dto.conversationId,
        message: result.message,
      });
    }

    return { message: result.message };
  }

  async sendMessageWithAttachments(
    senderId: string,
    dto: SendMessageWithAttachmentsDto,
    forwardMeta?: ForwardedMessageMeta,
  ): Promise<{ message: MessageView }> {
    this.uploadRules.assertAttachmentIdsForMessageType(
      dto.type,
      dto.attachmentIds.length,
    );

    const content =
      dto.content !== undefined && dto.content.length > 0 ? dto.content : null;

    await this.conversations.assertMaySendDirectMessage(senderId, dto.conversationId);
    await this.groupPostPolicy.assertUserMaySendMessage(senderId, dto.conversationId);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.membership.requireActiveMemberTx(tx, senderId, dto.conversationId);

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
          sticker: { include: { pack: true } },
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
        const metadataJson = this.forwardedMetadataJson(forwardMeta);
        const created = await tx.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId,
            clientMessageId: dto.clientMessageId,
            type: dto.type,
            content,
            replyToMessageId: dto.replyToMessageId ?? null,
            ...(metadataJson ? { metadataJson } : {}),
          },
          include: {
            sender: true,
            attachments: { orderBy: { sortOrder: 'asc' } },
            sticker: { include: { pack: true } },
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
            sticker: { include: { pack: true } },
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
              sticker: { include: { pack: true } },
            },
          });
          if (again) {
            return { message: this.toMessageView(again), created: false };
          }
        }
        throw err;
      }
    });

    if (result.created) {
      this.domainEvents.emit({
        type: 'message.created',
        conversationId: dto.conversationId,
        message: result.message,
      });
    }

    return { message: result.message };
  }

  async recallMessage(
    actorId: string,
    messageId: string,
  ): Promise<{ message: MessageView }> {
    return this.softDeleteMessage(actorId, messageId, 'recalled');
  }

  async deleteMessage(
    actorId: string,
    messageId: string,
  ): Promise<{ message: MessageView }> {
    return this.softDeleteMessage(actorId, messageId, 'deleted');
  }

  /**
   * Hides a message only for the current user (others still see it). Distinct from
   * {@link deleteMessage} which soft-deletes for everyone in the thread.
   */
  async hideMessageForSelf(
    actorId: string,
    messageId: string,
  ): Promise<{ ok: true }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.membership.requireActiveMember(actorId, message.conversationId);
    try {
      await this.prisma.messageUserHidden.create({
        data: {
          messageId: message.id,
          userId: actorId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return { ok: true };
      }
      throw err;
    }
    return { ok: true };
  }

  async forwardMessage(
    actorId: string,
    sourceMessageId: string,
    targetConversationId: string,
    clientMessageId: string,
  ): Promise<{ message: MessageView }> {
    const source = await this.prisma.message.findUnique({
      where: { id: sourceMessageId },
      include: {
        sender: true,
        attachments: { orderBy: { sortOrder: 'asc' } },
        sticker: { include: { pack: true } },
      },
    });
    if (!source) {
      throw new NotFoundException('Message not found');
    }
    await this.membership.requireActiveMember(actorId, source.conversationId);

    if (source.deletedAt) {
      throw new BadRequestException('Cannot forward a recalled/deleted message');
    }

    const targetConversation = await this.prisma.conversation.findUnique({
      where: { id: targetConversationId },
      select: { id: true, type: true },
    });
    if (!targetConversation) {
      throw new NotFoundException('Target conversation not found');
    }

    if (source.type === MessageType.system) {
      throw new BadRequestException('System messages cannot be forwarded');
    }

    const forwardMeta: ForwardedMessageMeta = {
      forwardedFromMessageId: sourceMessageId,
    };

    if (source.type === MessageType.text) {
      return this.sendTextMessage(
        actorId,
        {
          conversationId: targetConversationId,
          clientMessageId,
          content: source.content ?? '',
        },
        forwardMeta,
      );
    }

    if (source.type === MessageType.sticker) {
      if (!source.stickerId) {
        throw new BadRequestException('Source sticker message is invalid');
      }
      return this.sendStickerMessage(
        actorId,
        {
          conversationId: targetConversationId,
          clientMessageId,
          stickerId: source.stickerId,
        },
        forwardMeta,
      );
    }

    if (source.attachments.length > 0) {
      const clonedAttachmentIds = await this.prisma.$transaction(async (tx) => {
        await this.membership.requireActiveMemberTx(tx, actorId, targetConversationId);

        const created: string[] = [];
        for (const att of source.attachments) {
          const row = await tx.attachment.create({
            data: {
              uploadedById: actorId,
              storageKey: att.storageKey,
              bucket: att.bucket,
              mimeType: att.mimeType,
              originalFileName: att.originalFileName,
              fileSize: att.fileSize,
              attachmentType: att.attachmentType,
              width: att.width,
              height: att.height,
              durationSeconds: att.durationSeconds,
              thumbnailKey: att.thumbnailKey,
              sortOrder: att.sortOrder,
            },
            select: { id: true },
          });
          created.push(row.id);
        }
        return created;
      });

      return this.sendMessageWithAttachments(
        actorId,
        {
          conversationId: targetConversationId,
          clientMessageId,
          type: source.type,
          content: source.content ?? undefined,
          attachmentIds: clonedAttachmentIds,
        },
        forwardMeta,
      );
    }

    if (!source.content || source.content.trim().length === 0) {
      throw new BadRequestException('Source message has no forwardable payload');
    }

    return this.sendTextMessage(
      actorId,
      {
        conversationId: targetConversationId,
        clientMessageId,
        content: source.content,
      },
      forwardMeta,
    );
  }

  private async softDeleteMessage(
    actorId: string,
    messageId: string,
    mode: MessageDeletionMode,
  ): Promise<{ message: MessageView }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findUnique({
        where: { id: messageId },
        include: {
          sender: true,
          attachments: { orderBy: { sortOrder: 'asc' } },
          sticker: { include: { pack: true } },
        },
      });
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      await this.membership.requireActiveMemberTx(tx, actorId, message.conversationId);

      let allowModeratorRecall = false;
      if (message.senderId !== actorId) {
        if (mode === 'recalled') {
          const conv = await tx.conversation.findUnique({
            where: { id: message.conversationId },
            select: { type: true, groupSettingsJson: true },
          });
          if (conv?.type === ConversationType.group) {
            const settings = parseGroupSettings(conv.groupSettingsJson);
            if (settings.moderatorsCanRecallMessages) {
              const actorMember = await tx.conversationMember.findUnique({
                where: {
                  conversationId_userId: {
                    conversationId: message.conversationId,
                    userId: actorId,
                  },
                },
              });
              const actorRole = this.groupPermissions.normalizeRole(
                actorMember?.role ?? null,
              );
              if (
                actorRole === ConversationMemberRole.owner ||
                actorRole === ConversationMemberRole.admin
              ) {
                const senderMember = await tx.conversationMember.findUnique({
                  where: {
                    conversationId_userId: {
                      conversationId: message.conversationId,
                      userId: message.senderId,
                    },
                  },
                });
                const senderRole = this.groupPermissions.normalizeRole(
                  senderMember?.role ?? null,
                );
                if (senderRole === ConversationMemberRole.owner) {
                  throw new ForbiddenException(
                    "Group leaders' messages cannot be recalled by moderators",
                  );
                }
                if (message.type === MessageType.system) {
                  throw new BadRequestException('System messages cannot be recalled');
                }
                allowModeratorRecall = true;
              }
            }
          }
        }
        if (!allowModeratorRecall) {
          throw new ForbiddenException('Only the sender can perform this action');
        }
      }

      if (message.deletedAt) {
        return { message: this.toMessageView(message), changed: false };
      }

      const now = new Date();
      const updated = await tx.message.update({
        where: { id: messageId },
        data: {
          deletedAt: now,
          metadataJson: this.buildDeletionMetadata(
            message.metadataJson,
            mode,
            actorId,
            now,
          ),
        },
        include: {
          sender: true,
          attachments: { orderBy: { sortOrder: 'asc' } },
          sticker: { include: { pack: true } },
        },
      });

      return { message: this.toMessageView(updated), changed: true };
    });

    if (result.changed) {
      this.domainEvents.emit({
        type: 'message.updated',
        conversationId: result.message.conversationId,
        message: result.message,
      });
    }

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
    await this.membership.requireActiveMember(viewerId, conversationId);

    const limit = MessageHistoryQueryDto.resolveLimit(query.limit);
    const cursorPayload = query.cursor
      ? decodeMessageCursor(query.cursor)
      : null;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      hiddenByUsers: { none: { userId: viewerId } },
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
          sticker: { include: { pack: true } },
        },
      }),
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true },
      }),
    ]);

    const page = rows.slice(0, limit);
    const messageIds = page.map((m) => m.id);
    const reactionMap = await this.buildReactionSummariesForMessages(
      viewerId,
      messageIds,
    );

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
        const base = this.toMessageView(m, reactionMap.get(m.id));
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

  async getReactionsForMessage(
    viewerId: string,
    messageId: string,
  ): Promise<{ summary: ReactionSummaryView }> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
      select: { id: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.membership.requireActiveMember(viewerId, message.conversationId);
    const summary = await this.fetchReactionSummaryForMessage(
      viewerId,
      messageId,
    );
    return { summary };
  }

  async addReaction(
    userId: string,
    messageId: string,
    reaction: string,
  ): Promise<{
    summary: ReactionSummaryView;
    alreadyExists: boolean;
  }> {
    if (!isAllowedReaction(reaction)) {
      throw new BadRequestException('Reaction is not allowed');
    }

    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
      select: { id: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.membership.requireActiveMember(userId, message.conversationId);

    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_reaction: { messageId, userId, reaction },
      },
    });

    if (existing) {
      const summary = await this.fetchReactionSummaryForMessage(
        userId,
        messageId,
      );
      return { summary, alreadyExists: true };
    }

    await this.prisma.messageReaction.create({
      data: { messageId, userId, reaction },
    });

    const summary = await this.fetchReactionSummaryForMessage(
      userId,
      messageId,
    );

    this.domainEvents.emit({
      type: 'message.reaction_updated',
      conversationId: message.conversationId,
      messageId,
      /** Counts are global; `mine` is viewer-specific so omit in broadcast (clients merge locally). */
      summary: { counts: summary.counts, mine: [] },
    });

    return { summary, alreadyExists: false };
  }

  async removeReaction(
    userId: string,
    messageId: string,
    reaction: string,
  ): Promise<{ summary: ReactionSummaryView }> {
    if (!isAllowedReaction(reaction)) {
      throw new BadRequestException('Reaction is not allowed');
    }

    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
      select: { id: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.membership.requireActiveMember(userId, message.conversationId);

    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_reaction: { messageId, userId, reaction },
      },
    });
    if (!existing) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.messageReaction.delete({
      where: { id: existing.id },
    });

    const summary = await this.fetchReactionSummaryForMessage(
      userId,
      messageId,
    );

    this.domainEvents.emit({
      type: 'message.reaction_updated',
      conversationId: message.conversationId,
      messageId,
      summary: { counts: summary.counts, mine: [] },
    });

    return { summary };
  }

  private async fetchReactionSummaryForMessage(
    viewerId: string,
    messageId: string,
  ): Promise<ReactionSummaryView> {
    const rows = await this.prisma.messageReaction.findMany({
      where: { messageId },
      select: { reaction: true, userId: true },
    });
    return this.aggregateReactionRows(viewerId, rows);
  }

  private async buildReactionSummariesForMessages(
    viewerId: string,
    messageIds: string[],
  ): Promise<Map<string, ReactionSummaryView>> {
    const map = new Map<string, ReactionSummaryView>();
    if (messageIds.length === 0) {
      return map;
    }

    for (const id of messageIds) {
      map.set(id, { counts: [], mine: [] });
    }

    const rows = await this.prisma.messageReaction.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true, reaction: true, userId: true },
    });

    const grouped = new Map<string, { reaction: string; userId: string }[]>();
    for (const r of rows) {
      const arr = grouped.get(r.messageId) ?? [];
      arr.push({ reaction: r.reaction, userId: r.userId });
      grouped.set(r.messageId, arr);
    }

    for (const id of messageIds) {
      const list = grouped.get(id) ?? [];
      map.set(id, this.aggregateReactionRows(viewerId, list));
    }

    return map;
  }

  private aggregateReactionRows(
    viewerId: string,
    rows: { reaction: string; userId: string }[],
  ): ReactionSummaryView {
    const countBy = new Map<string, number>();
    const mine = new Set<string>();

    for (const r of rows) {
      countBy.set(r.reaction, (countBy.get(r.reaction) ?? 0) + 1);
      if (r.userId === viewerId) {
        mine.add(r.reaction);
      }
    }

    const counts = [...countBy.entries()]
      .map(([reaction, count]) => ({ reaction, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.reaction.localeCompare(b.reaction);
      });

    return {
      counts,
      mine: [...mine].sort((a, b) => a.localeCompare(b)),
    };
  }

  private toMessageView(
    row: MessageWithRelations,
    reactionSummary?: ReactionSummaryView,
  ): MessageView {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      clientMessageId: row.clientMessageId,
      type: row.type,
      content: row.deletedAt ? null : row.content,
      metadataJson: row.metadataJson ?? null,
      deletedAt: row.deletedAt,
      deletionMode: row.deletedAt
        ? this.parseDeletionMode(row.metadataJson)
        : null,
      replyToMessageId: row.replyToMessageId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: toPublicUserProfile(row.sender),
      attachments: row.deletedAt
        ? []
        : row.attachments.map((a) =>
            toAttachmentPublicDto(
              a,
              publicMediaUrlForStorageKey(this.config, a.storageKey),
            ),
          ),
      sticker: row.deletedAt ? null : row.sticker ? toStickerPublicDto(row.sticker) : null,
      reactions: row.deletedAt ? { counts: [], mine: [] } : reactionSummary ?? { counts: [], mine: [] },
    };
  }
}
