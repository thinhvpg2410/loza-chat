import { isRefAtOrAfterMessageIso, maxMessageTimelineRefIso, type MessageTimelineRef } from "@/lib/chat/message-timeline";
import type { Message } from "@/lib/types/chat";

export function applyPeerReceiptPointersToMessages(
  messages: Message[],
  peerDeliveredMax: MessageTimelineRef | null,
  peerReadMax: MessageTimelineRef | null,
): Message[] {
  return messages.map((m) => {
    if (!m.isOwn || m.kind === "system") return m;
    const timeline: MessageTimelineRef = { id: m.id, createdAt: m.createdAt };
    const peerDelivered = isRefAtOrAfterMessageIso(peerDeliveredMax, timeline);
    const peerSeen = isRefAtOrAfterMessageIso(peerReadMax, timeline);
    return { ...m, peerDelivered, peerSeen };
  });
}

export function initialPeerReceiptMaxFromMessages(messages: Message[]): {
  peerDeliveredMax: MessageTimelineRef | null;
  peerReadMax: MessageTimelineRef | null;
} {
  let peerDeliveredMax: MessageTimelineRef | null = null;
  let peerReadMax: MessageTimelineRef | null = null;
  for (const m of messages) {
    if (!m.isOwn || m.kind === "system") continue;
    const t: MessageTimelineRef = { id: m.id, createdAt: m.createdAt };
    if (m.peerDelivered) peerDeliveredMax = maxMessageTimelineRefIso(peerDeliveredMax, t);
    if (m.peerSeen) peerReadMax = maxMessageTimelineRefIso(peerReadMax, t);
  }
  return { peerDeliveredMax, peerReadMax };
}

export function mergeReceiptPointerFromSocketPayload(
  prev: MessageTimelineRef | null,
  payload: { messageId: string; at: string },
  messages: Message[],
): MessageTimelineRef | null {
  const hit = messages.find((m) => m.id === payload.messageId);
  const createdAt = hit?.createdAt ?? payload.at;
  const next: MessageTimelineRef = { id: payload.messageId, createdAt };
  return maxMessageTimelineRefIso(prev, next);
}
