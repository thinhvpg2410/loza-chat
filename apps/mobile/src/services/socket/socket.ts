import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "@/constants/env";
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
  onSocketConnected?: () => void;
  onMessageNew?: (message: ApiMessageView) => void;
  onMessageUpdated?: (message: ApiMessageView) => void;
  onTypingUpdate?: (payload: TypingUpdatePayload) => void;
  onReactionUpdated?: (payload: ReactionUpdatedPayload) => void;
  onMessageDelivered?: (payload: ReceiptBroadcastPayload) => void;
  onMessageSeen?: (payload: ReceiptBroadcastPayload) => void;
};

/** Normalized group room events (server dùng `message:new` / `message:updated` cho tin nhắn). */
export type GroupRoomEvent =
  | { type: "group_updated"; conversationId: string }
  | { type: "members_added"; conversationId: string; userIds: string[] }
  | { type: "members_removed"; conversationId: string; userId: string }
  | { type: "group_dissolved"; conversationId: string }
  | { type: "group_created"; conversationId: string; title?: string }
  | { type: "join_request_created"; conversationId: string; userId: string }
  | { type: "join_request_decided"; conversationId: string; userId: string; approved: boolean }
  | { type: "member_role_updated"; conversationId: string; userId: string; role: string };

const groupRoomListeners = new Set<(ev: GroupRoomEvent) => void>();

export function subscribeGroupRoomEvents(listener: (ev: GroupRoomEvent) => void): () => void {
  groupRoomListeners.add(listener);
  return () => {
    groupRoomListeners.delete(listener);
  };
}

function dispatchGroupRoomEvent(ev: GroupRoomEvent) {
  useChatStore.getState().scheduleConversationsListRefresh();
  for (const fn of groupRoomListeners) {
    try {
      fn(ev);
    } catch {
      /* ignore */
    }
  }
}

const EV_MESSAGE_NEW = "message:new";
const EV_MESSAGE_UPDATED = "message:updated";
const EV_TYPING_UPDATE = "typing:update";
const EV_REACTION_UPDATED = "message:reaction_updated";
const EV_MESSAGE_DELIVERED = "message:delivered";
const EV_MESSAGE_SEEN = "message:seen";

let socket: Socket | null = null;
let handlers: ChatRealtimeHandlers = {};
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function stopHeartbeatLoop() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeatLoop() {
  stopHeartbeatLoop();
  if (!socket) return;
  socket.emit("presence:heartbeat", {});
  heartbeatTimer = setInterval(() => {
    if (!socket?.connected) return;
    socket.emit("presence:heartbeat", {});
  }, 25_000);
}

export function setChatRealtimeHandlers(next: ChatRealtimeHandlers) {
  handlers = next;
}

export function clearChatRealtimeHandlers() {
  handlers = {};
}

export function isChatSocketConfigured(): boolean {
  return Boolean(SOCKET_URL);
}

export function connectChatSocket(accessToken?: string): () => void {
  const url = SOCKET_URL;
  if (!url) {
    return () => {};
  }

  socket = io(url, {
    transports: ["websocket", "polling"],
    auth: accessToken ? { token: accessToken } : {},
  });

  socket.on("connect", () => {
    startHeartbeatLoop();
    handlers.onSocketConnected?.();
    useChatStore.getState().scheduleConversationsListRefresh();
  });
  socket.on("disconnect", () => {
    stopHeartbeatLoop();
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
    const raw = body as Partial<ReactionUpdatedPayload> & {
      summary?: { counts?: { reaction: string; count: number }[]; mine?: string[] };
    };
    if (!raw.conversationId || !raw.messageId) return;
    const counts = raw.summary?.counts;
    if (!Array.isArray(counts)) return;
    const p: ReactionUpdatedPayload = {
      conversationId: raw.conversationId,
      messageId: raw.messageId,
      summary: {
        counts,
        mine: Array.isArray(raw.summary?.mine) ? raw.summary!.mine : [],
      },
    };
    handlers.onReactionUpdated?.(p);
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

  socket.on("group:updated", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const cid = (body as { conversationId?: string }).conversationId;
    if (typeof cid === "string" && cid.length) {
      dispatchGroupRoomEvent({ type: "group_updated", conversationId: cid });
    }
  });
  socket.on("group:members_added", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; userIds?: string[] };
    const cid = raw.conversationId;
    const userIds = raw.userIds;
    if (typeof cid === "string" && cid.length && Array.isArray(userIds)) {
      dispatchGroupRoomEvent({ type: "members_added", conversationId: cid, userIds });
    }
  });
  socket.on("group:members_removed", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; userId?: string };
    const cid = raw.conversationId;
    const userId = raw.userId;
    if (typeof cid === "string" && cid.length && typeof userId === "string") {
      dispatchGroupRoomEvent({ type: "members_removed", conversationId: cid, userId });
    }
  });
  socket.on("group:dissolved", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const cid = (body as { conversationId?: string }).conversationId;
    if (typeof cid === "string" && cid.length) {
      useChatStore.getState().notifyGroupDissolved(cid);
      dispatchGroupRoomEvent({ type: "group_dissolved", conversationId: cid });
    }
  });

  socket.on("group.created", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; title?: string };
    const cid = raw.conversationId;
    if (typeof cid === "string" && cid.length) {
      dispatchGroupRoomEvent({
        type: "group_created",
        conversationId: cid,
        ...(typeof raw.title === "string" ? { title: raw.title } : {}),
      });
    }
  });
  socket.on("group.join_request_created", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; userId?: string };
    if (typeof raw.conversationId === "string" && typeof raw.userId === "string") {
      dispatchGroupRoomEvent({
        type: "join_request_created",
        conversationId: raw.conversationId,
        userId: raw.userId,
      });
    }
  });
  socket.on("group.join_request_decided", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; userId?: string; approved?: boolean };
    if (
      typeof raw.conversationId === "string" &&
      typeof raw.userId === "string" &&
      typeof raw.approved === "boolean"
    ) {
      dispatchGroupRoomEvent({
        type: "join_request_decided",
        conversationId: raw.conversationId,
        userId: raw.userId,
        approved: raw.approved,
      });
    }
  });
  socket.on("group.member_role_updated", (body: unknown) => {
    if (!body || typeof body !== "object") return;
    const raw = body as { conversationId?: string; userId?: string; role?: string };
    if (typeof raw.conversationId === "string" && typeof raw.userId === "string" && typeof raw.role === "string") {
      dispatchGroupRoomEvent({
        type: "member_role_updated",
        conversationId: raw.conversationId,
        userId: raw.userId,
        role: raw.role,
      });
    }
  });

  return () => {
    stopHeartbeatLoop();
    socket?.off("connect");
    socket?.off("disconnect");
    socket?.off(EV_MESSAGE_NEW);
    socket?.off(EV_MESSAGE_UPDATED);
    socket?.off(EV_TYPING_UPDATE);
    socket?.off(EV_REACTION_UPDATED);
    socket?.off(EV_MESSAGE_DELIVERED);
    socket?.off(EV_MESSAGE_SEEN);
    socket?.off("group:updated");
    socket?.off("group:members_added");
    socket?.off("group:members_removed");
    socket?.off("group:dissolved");
    socket?.off("group.created");
    socket?.off("group.join_request_created");
    socket?.off("group.join_request_decided");
    socket?.off("group.member_role_updated");
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
  if (!conversationId.trim().length) return;
  socket?.emit("conversation:join", { conversationId });
}

export function emitTypingStart(conversationId: string) {
  socket?.emit("typing:start", { conversationId });
}

export function emitTypingStop(conversationId: string) {
  socket?.emit("typing:stop", { conversationId });
}
