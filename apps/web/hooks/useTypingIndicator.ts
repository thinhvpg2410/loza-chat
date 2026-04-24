"use client";

import { useMemo } from "react";

/**
 * Turns `{ userId: isTyping }` from socket `typing:update` into a short banner label.
 * Optionally resolves user ids to display names when a lookup map is provided.
 */
export function useTypingIndicatorLabel(
  typingPeers: Record<string, boolean>,
  opts?: { nameByUserId?: Record<string, string> },
): { count: number; label: string } {
  return useMemo(() => {
    const ids = Object.keys(typingPeers).filter((id) => typingPeers[id]);
    const count = ids.length;
    if (count === 0) return { count: 0, label: "" };
    const map = opts?.nameByUserId;
    if (count === 1 && map?.[ids[0]!]) {
      return { count: 1, label: `${map[ids[0]!]} đang nhập…` };
    }
    if (count === 1) return { count: 1, label: "Đang soạn tin nhắn…" };
    return { count, label: `${count} người đang nhập…` };
  }, [typingPeers, opts?.nameByUserId]);
}
