import { io, type Socket } from "socket.io-client";

import type { ApiMessageView } from "@/services/conversations/conversationsApi";

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

export type ChatRealtimeHandlers = {
  onMessageNew?: (message: ApiMessageView) => void;
  onTypingUpdate?: (payload: TypingUpdatePayload) => void;
  onReactionUpdated?: (payload: ReactionUpdatedPayload) => void;
};

const EV_MESSAGE_NEW = "message:new";
const EV_TYPING_UPDATE = "typing:update";
const EV_REACTION_UPDATED = "message:reaction_updated";

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

  return () => {
    socket?.off(EV_MESSAGE_NEW);
    socket?.off(EV_TYPING_UPDATE);
    socket?.off(EV_REACTION_UPDATED);
    socket?.disconnect();
    socket = null;
  };
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
