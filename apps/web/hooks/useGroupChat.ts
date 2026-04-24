"use client";

import { useEffect, useRef } from "react";
import type { ChatRealtimeContextValue, GroupRoomEvent } from "@/components/chat/chat-realtime-context";

type UseGroupChatOptions = {
  realtime: Pick<ChatRealtimeContextValue, "subscribeGroupRoom"> | null;
  conversationId: string | null;
  isGroup: boolean;
  onGroupEvent: (ev: GroupRoomEvent) => void;
};

/**
 * Subscribes to normalized group socket events for a single thread (e.g. refetch group detail).
 * `message:new` / `message:updated` stay on `registerRoom` in {@link ApiChatPanel}.
 */
export function useGroupChat(opts: UseGroupChatOptions): void {
  const { realtime, conversationId, isGroup, onGroupEvent } = opts;
  const cbRef = useRef(onGroupEvent);
  cbRef.current = onGroupEvent;

  useEffect(() => {
    if (!realtime?.subscribeGroupRoom || !isGroup || !conversationId) return;
    return realtime.subscribeGroupRoom((ev) => {
      if (ev.conversationId !== conversationId) return;
      cbRef.current(ev);
    });
  }, [realtime, conversationId, isGroup]);
}
