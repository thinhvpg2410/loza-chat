"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getChatRealtimeSessionAction } from "@/features/chat/chat-actions";
import type { ApiMessageWithReceipt } from "@/lib/chat/api-dtos";
import { socketMessageViewToApiRow } from "@/lib/chat/socket-message-map";

export type ChatReceiptPayload = {
  conversationId: string;
  userId: string;
  messageId: string;
  at: string;
};

export type RoomRealtimeHandlers = {
  onMessageNew: (row: ApiMessageWithReceipt) => void;
  onMessageUpdated?: (row: ApiMessageWithReceipt) => void;
  onTypingUpdate: (p: { userId: string; isTyping: boolean }) => void;
  onReceipt: (kind: "delivered" | "seen", p: ChatReceiptPayload) => void;
  onReactionUpdated?: (p: {
    conversationId: string;
    messageId: string;
    summary: ApiMessageWithReceipt["reactions"];
  }) => void;
};

type ChatRealtimeContextValue = {
  status: "idle" | "connecting" | "ready" | "error";
  connectionError: string | null;
  /** True after first successful Socket.IO connect for this session (false on disconnect). */
  socketConnected: boolean;
  viewerUserId: string;
  apiBaseUrl: string;
  registerRoom: (conversationId: string, handlers: RoomRealtimeHandlers) => () => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  emitSeen: (conversationId: string, messageId: string) => void;
  emitDelivered: (conversationId: string, messageId: string) => void;
};

const ChatRealtimeContext = createContext<ChatRealtimeContextValue | null>(null);

type ChatRealtimeProviderProps = {
  children: React.ReactNode;
  conversationIds: string[];
  activeConversationId: string | null;
  onRemoteMessageForList?: (
    conversationId: string,
    row: ApiMessageWithReceipt,
    meta: { bumpUnread: boolean },
  ) => void;
  onRemoteMessageUpdatedForList?: (
    conversationId: string,
    row: ApiMessageWithReceipt,
  ) => void;
};

export function ChatRealtimeProvider({
  children,
  conversationIds,
  activeConversationId,
  onRemoteMessageForList,
  onRemoteMessageUpdatedForList,
}: ChatRealtimeProviderProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "ready" | "error">("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [session, setSession] = useState<{
    apiBaseUrl: string;
    accessToken: string;
    viewerUserId: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef<Set<string>>(new Set());
  const roomsRef = useRef<Map<string, RoomRealtimeHandlers>>(new Map());
  const conversationIdsRef = useRef(conversationIds);
  const activeIdRef = useRef(activeConversationId);
  const onListRef = useRef(onRemoteMessageForList);
  const onListUpdatedRef = useRef(onRemoteMessageUpdatedForList);
  useEffect(() => {
    conversationIdsRef.current = conversationIds;
    activeIdRef.current = activeConversationId;
    onListRef.current = onRemoteMessageForList;
    onListUpdatedRef.current = onRemoteMessageUpdatedForList;
  }, [conversationIds, activeConversationId, onRemoteMessageForList, onRemoteMessageUpdatedForList]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setStatus("connecting"));
    void getChatRealtimeSessionAction().then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setSession(null);
        setConnectionError(r.error);
        setStatus("error");
        return;
      }
      setSession({
        apiBaseUrl: r.apiBaseUrl,
        accessToken: r.accessToken,
        viewerUserId: r.viewerUserId,
      });
      setConnectionError(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const joinAllPending = useCallback((socket: Socket) => {
    const merged = new Set(conversationIdsRef.current);
    const active = activeIdRef.current;
    if (active) merged.add(active);
    for (const id of merged) {
      if (joinedRef.current.has(id)) continue;
      socket.emit("conversation:join", { conversationId: id });
      joinedRef.current.add(id);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const joinedTracker = joinedRef.current;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const startHeartbeat = (socket: Socket) => {
      stopHeartbeat();
      socket.emit("presence:heartbeat", {});
      heartbeatTimer = setInterval(() => {
        if (!socket.connected) return;
        socket.emit("presence:heartbeat", {});
      }, 25_000);
    };

    const socket = io(session.apiBaseUrl, {
      auth: { token: session.accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 800,
    });
    socketRef.current = socket;

    const onConnect = () => {
      joinedTracker.clear();
      setSocketConnected(true);
      setStatus("ready");
      setConnectionError(null);
      startHeartbeat(socket);
      joinAllPending(socket);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      stopHeartbeat();
    };

    const onConnectError = (err: Error) => {
      setConnectionError(err.message || "Lỗi kết nối realtime");
    };

    const onReconnectFailed = () => {
      setConnectionError("Không kết nối được realtime sau nhiều lần thử.");
      setStatus("error");
      setSocketConnected(false);
    };

    const onMessageNew = (payload: { message?: unknown }) => {
      const raw = payload?.message;
      if (!raw || typeof raw !== "object") return;
      const row = socketMessageViewToApiRow(raw, session.viewerUserId);
      if (!row) return;
      const convId = row.conversationId;
      const activeId = activeIdRef.current;
      const bumpUnread = convId !== activeId && !row.sentByViewer;
      onListRef.current?.(convId, row, { bumpUnread });
      roomsRef.current.get(convId)?.onMessageNew(row);
    };

    const onMessageUpdated = (payload: { message?: unknown }) => {
      const raw = payload?.message;
      if (!raw || typeof raw !== "object") return;
      const row = socketMessageViewToApiRow(raw, session.viewerUserId);
      if (!row) return;
      onListUpdatedRef.current?.(row.conversationId, row);
      roomsRef.current.get(row.conversationId)?.onMessageUpdated?.(row);
    };

    const onTyping = (payload: {
      conversationId?: string;
      userId?: string;
      isTyping?: boolean;
    }) => {
      if (!payload.conversationId || !payload.userId) return;
      roomsRef.current.get(payload.conversationId)?.onTypingUpdate({
        userId: payload.userId,
        isTyping: Boolean(payload.isTyping),
      });
    };

    const onDelivered = (payload: ChatReceiptPayload) => {
      roomsRef.current.get(payload.conversationId)?.onReceipt("delivered", payload);
    };

    const onSeen = (payload: ChatReceiptPayload) => {
      roomsRef.current.get(payload.conversationId)?.onReceipt("seen", payload);
    };

    const onReaction = (payload: {
      conversationId?: string;
      messageId?: string;
      summary?: ApiMessageWithReceipt["reactions"];
    }) => {
      if (!payload.conversationId || !payload.messageId || !payload.summary) return;
      roomsRef.current.get(payload.conversationId)?.onReactionUpdated?.({
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        summary: payload.summary,
      });
    };

    const onSocketError = (payload: unknown) => {
      const msg =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: unknown }).message)
          : "Lỗi realtime";
      setConnectionError(msg);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.on("message:new", onMessageNew);
    socket.on("message:updated", onMessageUpdated);
    socket.on("typing:update", onTyping);
    socket.on("message:delivered", onDelivered);
    socket.on("message:seen", onSeen);
    socket.on("message:reaction_updated", onReaction);
    socket.on("error", onSocketError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      stopHeartbeat();
      setSocketConnected(false);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.off("message:new", onMessageNew);
      socket.off("message:updated", onMessageUpdated);
      socket.off("typing:update", onTyping);
      socket.off("message:delivered", onDelivered);
      socket.off("message:seen", onSeen);
      socket.off("message:reaction_updated", onReaction);
      socket.off("error", onSocketError);
      socket.disconnect();
      socketRef.current = null;
      joinedTracker.clear();
    };
  }, [session, joinAllPending]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    joinAllPending(socket);
  }, [conversationIds, activeConversationId, joinAllPending, status]);

  const registerRoom = useCallback((conversationId: string, handlers: RoomRealtimeHandlers) => {
    roomsRef.current.set(conversationId, handlers);
    return () => {
      if (roomsRef.current.get(conversationId) === handlers) {
        roomsRef.current.delete(conversationId);
      }
    };
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:stop", { conversationId });
  }, []);

  const emitSeen = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit("message:seen", { conversationId, messageId });
  }, []);

  const emitDelivered = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit("message:delivered", { conversationId, messageId });
  }, []);

  const memoizedRealtimeApi = useMemo((): ChatRealtimeContextValue | null => {
    if (!session) {
      if (status === "error") {
        return {
          status: "error",
          connectionError,
          socketConnected: false,
          viewerUserId: "",
          apiBaseUrl: "",
          registerRoom: () => () => {},
          startTyping: () => {},
          stopTyping: () => {},
          emitSeen: () => {},
          emitDelivered: () => {},
        };
      }
      return null;
    }
    return {
      status,
      connectionError,
      socketConnected,
      viewerUserId: session.viewerUserId,
      apiBaseUrl: session.apiBaseUrl,
      registerRoom,
      startTyping,
      stopTyping,
      emitSeen,
      emitDelivered,
    };
  }, [
    session,
    status,
    connectionError,
    socketConnected,
    registerRoom,
    startTyping,
    stopTyping,
    emitSeen,
    emitDelivered,
  ]);

  /* useMemo result; false positive from react-hooks/refs (name matched ref heuristic). */
  // eslint-disable-next-line react-hooks/refs
  if (!memoizedRealtimeApi) {
    return (
      <>
        {status === "connecting" ? (
          <div className="shrink-0 border-b border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-1.5 text-center text-[11px] text-[var(--zalo-text-muted)]">
            Đang kết nối realtime…
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <ChatRealtimeContext.Provider value={memoizedRealtimeApi}>
      {connectionError ? (
        <div
          className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-[11px] text-amber-900"
          role="status"
        >
          {connectionError}
        </div>
      ) : null}
      {children}
    </ChatRealtimeContext.Provider>
  );
}

export function useChatRealtime(): ChatRealtimeContextValue | null {
  return useContext(ChatRealtimeContext);
}
