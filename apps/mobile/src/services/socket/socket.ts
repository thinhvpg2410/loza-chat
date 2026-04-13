import { io, type Socket } from "socket.io-client";

import type { ApiConversationMemberProgress, ApiMessageView } from "@/services/conversations/conversationsApi";
import { useChatStore } from "@/store/chatStore";

export type TypingUpdatePayload = {
  conversationId: string;
  userId: string;
  isTyping: boolean;
};

export type ReactionUpdatedPayload = {
  conversationId: string;
  messageId: string;
  summary: { counts: { reaction: string; count: number }[]; mine: string[] };
};

export type ReceiptBroadcastPayload = {
  conversationId: string;
  userId: string;
  messageId: string;
  at: string;
};

export type ChatRealtimeHandlers = {
  onMessageNew?: (message: ApiMessageView) => void;
  onMessageUpdated?: (message: ApiMessageView) => void;
  onTypingUpdate?: (payload: TypingUpdatePayload) => void;
  onReactionUpdated?: (payload: ReactionUpdatedPayload) => void;
  onMessageDelivered?: (payload: ReceiptBroadcastPayload) => void;
  onMessageSeen?: (payload: ReceiptBroadcastPayload) => void;
};

const EV_MESSAGE_NEW = "message:new";
const EV_MESSAGE_UPDATED = "message:updated";
const EV_TYPING_UPDATE = "typing:update";
const EV_REACTION_UPDATED = "message:reaction_updated";
const EV_MESSAGE_DELIVERED = "message:delivered";
const EV_MESSAGE_SEEN = "message:seen";

let socket: Socket | null = null;
let handlers: ChatRealtimeHandlers = {};

export function setChatRealtimeHandlers(next: ChatRealtimeHandlers) {
  handlers = next;
}

export function clearChatRealtimeHandlers() {
  handlers = {};
}

export function isChatSocketConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SOCKET_URL?.trim());
}

export function connectChatSocket(accessToken?: string): () => void {
  const url = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();
  if (!url) {
    return () => {};
  }

  socket = io(url, {
    transports: ["websocket", "polling"],
    auth: accessToken ? { token: accessToken } : {},
  });

  socket.on(EV_MESSAGE_NEW, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const msg = (body as { message?: ApiMessageView }).message;
    if (msg && typeof msg === "object" && "id" in msg) {
      handlers.onMessageNew?.(msg);
      useChatStore.getState().scheduleConversationsListRefresh();
    }
  });

  socket.on(EV_MESSAGE_UPDATED, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const msg = (body as { message?: ApiMessageView }).message;
    if (msg && typeof msg === "object" && "id" in msg) {
      handlers.onMessageUpdated?.(msg);
      useChatStore.getState().scheduleConversationsListRefresh();
    }
  });

  socket.on(EV_TYPING_UPDATE, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const p = body as TypingUpdatePayload;
    if (p.conversationId && p.userId != null && typeof p.isTyping === "boolean") {
      handlers.onTypingUpdate?.(p);
    }
  });

  socket.on(EV_REACTION_UPDATED, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const p = body as ReactionUpdatedPayload;
    if (p.conversationId && p.messageId && p.summary) {
      handlers.onReactionUpdated?.(p);
    }
  });

  socket.on(EV_MESSAGE_DELIVERED, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const p = body as ReceiptBroadcastPayload;
    if (p.conversationId && p.userId && p.messageId) {
      handlers.onMessageDelivered?.(p);
    }
  });

  socket.on(EV_MESSAGE_SEEN, (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const p = body as ReceiptBroadcastPayload;
    if (p.conversationId && p.userId && p.messageId) {
      handlers.onMessageSeen?.(p);
    }
  });

  return () => {
    socket?.off(EV_MESSAGE_NEW);
    socket?.off(EV_MESSAGE_UPDATED);
    socket?.off(EV_TYPING_UPDATE);
    socket?.off(EV_REACTION_UPDATED);
    socket?.off(EV_MESSAGE_DELIVERED);
    socket?.off(EV_MESSAGE_SEEN);
    socket?.disconnect();
    socket = null;
  };
}

export function emitMessageDelivered(conversationId: string, messageId: string) {
  socket?.emit(EV_MESSAGE_DELIVERED, { conversationId, messageId });
}

export function emitMessageSeen(conversationId: string, messageId: string) {
  socket?.emit(EV_MESSAGE_SEEN, { conversationId, messageId });
}

/** After REST read/delivered advance, mirror pointers on the socket so the peer updates in realtime. */
export function emitConversationReceiptsFromMyProgress(
  conversationId: string,
  me: ApiConversationMemberProgress,
) {
  if (me.lastDeliveredMessageId) {
    emitMessageDelivered(conversationId, me.lastDeliveredMessageId);
  }
  if (me.lastReadMessageId) {
    emitMessageSeen(conversationId, me.lastReadMessageId);
  }
}

export function emitConversationJoin(conversationId: string) {
  socket?.emit("conversation:join", { conversationId });
}

export function emitTypingStart(conversationId: string) {
  socket?.emit("typing:start", { conversationId });
}

export function emitTypingStop(conversationId: string) {
  socket?.emit("typing:stop", { conversationId });
}
