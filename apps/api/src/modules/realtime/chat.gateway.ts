import {
  HttpException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageType, type User } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import type { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { ConversationMembershipService } from '../conversations/conversation-membership.service';
import { FriendsService } from '../friends/friends.service';
import { GroupDomainEventsService } from '../groups/group-domain-events.service';
import { MessageReceiptsService } from '../messages/message-receipts.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationJoinDto } from './dto/conversation-join.dto';
import { MessageReceiptSocketDto } from './dto/message-receipt-socket.dto';
import { MessageSendSocketDto } from './dto/message-send-socket.dto';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { TypingSocketDto } from './dto/typing-socket.dto';
import { PresenceService } from './presence.service';
import { conversationRoomId, userDirectRoomId } from './realtime.constants';
import { SocketAuthService } from './socket-auth.service';
import type { ChatSocketData } from './types/chat-socket-data';
import { TypingStateService } from './typing-state.service';
import { WsPayloadValidationError, parseWsPayload } from './ws-payload.util';

@SkipThrottle()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  private groupEventsSub?: Subscription;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly membership: ConversationMembershipService,
    private readonly messages: MessagesService,
    private readonly receipts: MessageReceiptsService,
    private readonly presence: PresenceService,
    private readonly typing: TypingStateService,
    private readonly friends: FriendsService,
    private readonly groupDomainEvents: GroupDomainEventsService,
  ) {}

  onModuleInit(): void {
    this.groupEventsSub = this.groupDomainEvents.events$.subscribe((ev) => {
      const room = conversationRoomId(ev.conversationId);
      switch (ev.type) {
        case 'group.updated':
          this.server.to(room).emit('group:updated', {
            conversationId: ev.conversationId,
            ...ev.payload,
          });
          break;
        case 'group.member_added':
          this.server.to(room).emit('group:members_added', {
            conversationId: ev.conversationId,
            userIds: ev.userIds,
          });
          break;
        case 'group.member_removed':
          this.server.to(room).emit('group:members_removed', {
            conversationId: ev.conversationId,
            userId: ev.userId,
          });
          break;
        case 'group.system_message':
          this.server.to(room).emit('conversation:system_message', {
            conversationId: ev.conversationId,
            messageId: ev.messageId,
          });
          break;
        default: {
          const _x: never = ev;
          void _x;
        }
      }
    });
  }

  onModuleDestroy(): void {
    this.groupEventsSub?.unsubscribe();
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const ctx = await this.socketAuth.authenticateHandshake(client.handshake);
      const data = client.data as ChatSocketData;
      data.user = ctx.user;
      data.deviceId = ctx.deviceId;
      data.conversationRooms = new Set<string>();

      await client.join(userDirectRoomId(ctx.user.id));

      const { becameOnline } = this.presence.addSocket(ctx.user.id, client.id);
      if (becameOnline) {
        void this.broadcastPresenceToFriends(ctx.user.id, true);
      }
    } catch (err) {
      this.logger.debug(`Socket auth failed: ${String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = (client.data as ChatSocketData).user;
    if (!user) {
      return;
    }

    const rooms = (client.data as ChatSocketData).conversationRooms;
    if (rooms && rooms.size > 0) {
      const cleared = this.typing.clearUserFromConversations(user.id, rooms);
      for (const row of cleared) {
        if (row.wasTyping) {
          this.server
            .to(conversationRoomId(row.conversationId))
            .emit('typing:update', {
              conversationId: row.conversationId,
              userId: user.id,
              isTyping: false,
            });
        }
      }
    }

    const { becameOffline } = this.presence.removeSocket(user.id, client.id);
    if (becameOffline) {
      void this.broadcastPresenceToFriends(user.id, false);
    }
  }

  @SubscribeMessage('conversation:join')
  async onConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean; conversationId?: string }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(ConversationJoinDto, body);
      await this.membership.requireMember(user.id, dto.conversationId);
      const room = conversationRoomId(dto.conversationId);
      await client.join(room);
      const data = client.data as ChatSocketData;
      data.conversationRooms ??= new Set();
      data.conversationRooms.add(dto.conversationId);
      return { ok: true, conversationId: dto.conversationId };
    } catch (err) {
      this.emitStructuredError(client, 'conversation:join', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(MessageSendSocketDto, body);
      if (dto.type !== MessageType.text) {
        throw new WsPayloadValidationError('Only text messages are supported');
      }

      const { message } = await this.messages.sendTextMessage(user.id, {
        conversationId: dto.conversationId,
        clientMessageId: dto.clientMessageId,
        content: dto.content,
        replyToMessageId: dto.replyToMessageId,
      });

      this.server
        .to(conversationRoomId(dto.conversationId))
        .emit('message:new', { message });

      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'message:send', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('message:delivered')
  async onMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(MessageReceiptSocketDto, body);
      const payload = await this.receipts.markDelivered(
        user.id,
        dto.conversationId,
        dto.messageId,
      );
      this.server
        .to(conversationRoomId(dto.conversationId))
        .emit('message:delivered', payload);
      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'message:delivered', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('message:seen')
  async onMessageSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(MessageReceiptSocketDto, body);
      const payload = await this.receipts.markSeen(
        user.id,
        dto.conversationId,
        dto.messageId,
      );
      this.server
        .to(conversationRoomId(dto.conversationId))
        .emit('message:seen', payload);
      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'message:seen', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('typing:start')
  async onTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(TypingSocketDto, body);
      await this.membership.requireMember(user.id, dto.conversationId);
      const started = this.typing.startTyping(dto.conversationId, user.id);
      if (started) {
        this.server
          .to(conversationRoomId(dto.conversationId))
          .emit('typing:update', {
            conversationId: dto.conversationId,
            userId: user.id,
            isTyping: true,
          });
      }
      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'typing:start', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('typing:stop')
  async onTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const user = this.requireUser(client);
      const dto = parseWsPayload(TypingSocketDto, body);
      await this.membership.requireMember(user.id, dto.conversationId);
      const stopped = this.typing.stopTyping(dto.conversationId, user.id);
      if (stopped) {
        this.server
          .to(conversationRoomId(dto.conversationId))
          .emit('typing:update', {
            conversationId: dto.conversationId,
            userId: user.id,
            isTyping: false,
          });
      }
      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'typing:stop', err);
      return { ok: false };
    }
  }

  @SubscribeMessage('presence:heartbeat')
  onPresenceHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): { ok: boolean } {
    try {
      const user = this.requireUser(client);
      parseWsPayload(PresenceHeartbeatDto, body);
      this.presence.heartbeat(user.id, client.id);
      const snap = this.presence.getSnapshot(user.id);
      client.emit('presence:update', {
        userId: user.id,
        online: snap.online,
        lastHeartbeatAt: snap.lastHeartbeatAt,
        lastSeenAt: null,
      });
      return { ok: true };
    } catch (err) {
      this.emitStructuredError(client, 'presence:heartbeat', err);
      return { ok: false };
    }
  }

  private requireUser(client: Socket): User {
    const u = (client.data as ChatSocketData).user;
    if (!u) {
      throw new UnauthorizedException('Unauthenticated socket');
    }
    return u;
  }

  private emitStructuredError(
    client: Socket,
    sourceEvent: string,
    err: unknown,
  ): void {
    if (err instanceof WsPayloadValidationError) {
      client.emit('error', {
        code: 'VALIDATION_ERROR',
        message: err.message,
        sourceEvent,
        at: new Date().toISOString(),
      });
      return;
    }
    if (err instanceof HttpException) {
      const status = err.getStatus();
      const res = err.getResponse();
      let message = err.message;
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const m = (res as { message: unknown }).message;
        if (typeof m === 'string') {
          message = m;
        } else if (Array.isArray(m)) {
          message = m.map(String).join(', ');
        }
      }
      client.emit('error', {
        code: `HTTP_${status}`,
        message,
        sourceEvent,
        at: new Date().toISOString(),
      });
      return;
    }
    this.logger.warn(`Realtime error (${sourceEvent}): ${String(err)}`);
    client.emit('error', {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      sourceEvent,
      at: new Date().toISOString(),
    });
  }

  private async broadcastPresenceToFriends(
    userId: string,
    online: boolean,
  ): Promise<void> {
    const friendIds = await this.friends.listFriendUserIds(userId);
    const now = new Date().toISOString();
    const payload = online
      ? {
          userId,
          online: true as const,
          lastHeartbeatAt: now,
          lastSeenAt: null as string | null,
        }
      : {
          userId,
          online: false as const,
          lastHeartbeatAt: null as string | null,
          lastSeenAt: now,
        };

    for (const fid of friendIds) {
      this.server.to(userDirectRoomId(fid)).emit('presence:update', payload);
    }
  }
}
