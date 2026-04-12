import type { ChatRoomMessage } from "./types";

/**
 * Applies a peer receipt pointer from `message:delivered` / `message:seen` to this client's
 * outgoing rows (messages sent by the viewer at or before the anchor message in timeline).
 */
export function applyOutgoingReceiptFromPeerPointer(
  prev: ChatRoomMessage[],
  pointerMessageId: string,
  level: "delivered" | "seen",
): ChatRoomMessage[] {
  const anchor = prev.find((m) => m.id === pointerMessageId);
  if (!anchor) return prev;
  const anchorMs = new Date(anchor.createdAt).getTime();
  return prev.map((m) => {
    if (m.senderRole !== "me") return m;
    const t = new Date(m.createdAt).getTime();
    if (t > anchorMs && m.id !== pointerMessageId) return m;
    if (level === "seen") return { ...m, delivery: "seen" };
    if (m.delivery === "seen") return m;
    return { ...m, delivery: "delivered" };
  });
}
