import type { ChatRoomMessage } from "./types";

/** Matches API / web: chronological by `createdAt`, tie-break by `id`. */
type TimelineRef = { id: string; createdAt: string };

function compareMessageTimelineIso(a: TimelineRef, b: TimelineRef): number {
  const dt = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (dt !== 0) return dt;
  return a.id.localeCompare(b.id);
}

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
  const anchorRef: TimelineRef = { id: anchor.id, createdAt: anchor.createdAt };
  return prev.map((m) => {
    if (m.senderRole !== "me") return m;
    const ref: TimelineRef = { id: m.id, createdAt: m.createdAt };
    if (compareMessageTimelineIso(ref, anchorRef) > 0) return m;
    if (level === "seen") return { ...m, delivery: "seen" };
    if (m.delivery === "seen") return m;
    return { ...m, delivery: "delivered" };
  });
}
