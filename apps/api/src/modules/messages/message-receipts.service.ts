import { Injectable } from '@nestjs/common';
import { ConversationProgressService } from '../conversations/conversation-progress.service';

export interface ReceiptBroadcastPayload {
  conversationId: string;
  userId: string;
  messageId: string;
  at: string;
}

@Injectable()
export class MessageReceiptsService {
  constructor(private readonly progress: ConversationProgressService) {}

  async markDelivered(
    actorId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ReceiptBroadcastPayload> {
    const { state, at } = await this.progress.advanceDelivered(
      actorId,
      conversationId,
      messageId,
    );

    return {
      conversationId,
      userId: actorId,
      messageId: state.me.lastDeliveredMessageId ?? messageId,
      at,
    };
  }

  async markSeen(
    actorId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ReceiptBroadcastPayload> {
    const { state, at } = await this.progress.advanceRead(
      actorId,
      conversationId,
      messageId,
    );

    return {
      conversationId,
      userId: actorId,
      messageId: state.me.lastReadMessageId ?? messageId,
      at,
    };
  }
}
