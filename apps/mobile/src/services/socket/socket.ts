import type { ChatMessage } from "@/types/chat";
import { io, type Socket } from "socket.io-client";

export const CHAT_EVENTS = {
  MESSAGE_SEND: "message:send",
  MESSAGE_RECEIVE: "message:receive",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
} as const;

export type ChatSocketHandlers = {
  onMessageReceive?: (message: ChatMessage) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
};

let socket: Socket | null = null;
let handlers: ChatSocketHandlers = {};

export function isChatSocketMockMode(): boolean {
  return !process.env.EXPO_PUBLIC_SOCKET_URL;
}

export function setChatSocketHandlers(next: ChatSocketHandlers) {
  handlers = next;
}

export function clearChatSocketHandlers() {
  handlers = {};
}

export function connectChatSocket(accessToken?: string): () => void {
  const url = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (!url) {
    return () => {};
  }

  socket = io(url, {
    transports: ["websocket"],
    auth: { token: accessToken },
    autoConnect: true,
  });

  socket.on(CHAT_EVENTS.MESSAGE_RECEIVE, (payload: ChatMessage) => {
    handlers.onMessageReceive?.(payload);
  });

  socket.on(CHAT_EVENTS.TYPING_START, () => {
    handlers.onTypingStart?.();
  });

  socket.on(CHAT_EVENTS.TYPING_STOP, () => {
    handlers.onTypingStop?.();
  });

  return () => {
    socket?.off(CHAT_EVENTS.MESSAGE_RECEIVE);
    socket?.off(CHAT_EVENTS.TYPING_START);
    socket?.off(CHAT_EVENTS.TYPING_STOP);
    socket?.disconnect();
    socket = null;
  };
}

export function emitMessageSend(payload: {
  conversationId: string;
  peerId: string;
  message: ChatMessage;
}) {
  socket?.emit(CHAT_EVENTS.MESSAGE_SEND, payload);
}

export function emitTypingStart(conversationId: string, peerId: string) {
  socket?.emit(CHAT_EVENTS.TYPING_START, { conversationId, peerId });
}

export function emitTypingStop(conversationId: string, peerId: string) {
  socket?.emit(CHAT_EVENTS.TYPING_STOP, { conversationId, peerId });
}
