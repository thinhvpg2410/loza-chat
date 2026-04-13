import { publicUrlForStorageKey } from "@/services/media/publicMediaUrl";
import type { ApiMessageWithReceipt } from "@/services/conversations/conversationsApi";

import type { ChatRoomMessage, MessageKind, MessageReaction, OutgoingDeliveryState, ReplyReference } from "./types";

function previewLineFromApi(m: ApiMessageWithReceipt): string {
  if (m.deletedAt) {
    return m.deletionMode === "recalled" ? "Tin nhắn đã được thu hồi" : "Tin nhắn đã bị xóa";
  }
  if (m.content?.trim()) return m.content.trim();
  if (m.type === "image") return "📷 Ảnh";
  if (m.type === "file") return m.attachments[0]?.originalFileName ?? "📎 Tệp";
  if (m.type === "sticker") return m.sticker?.code ?? m.sticker?.name ?? "🎭 Sticker";
  if (m.type === "voice") return "🎤 Ghi âm";
  if (m.type === "video") return "🎬 Video";
  if (m.type === "system") return "Thông báo";
  return "";
}

function mapReactions(r: ApiMessageWithReceipt["reactions"]): MessageReaction[] {
  const mine = new Set(r.mine ?? []);
  return (r.counts ?? []).map((c) => ({
    emoji: c.reaction,
    count: c.count,
    reactedByMe: mine.has(c.reaction),
  }));
}

function outgoingDelivery(m: ApiMessageWithReceipt): OutgoingDeliveryState | undefined {
  if (!m.sentByViewer) return undefined;
  if (m.seenByPeer) return "seen";
  if (m.deliveredToPeer) return "delivered";
  return "sent";
}

function resolveKind(m: ApiMessageWithReceipt): MessageKind {
  switch (m.type) {
    case "text":
    case "system":
      return "text";
    case "image":
      return "image";
    case "sticker":
      return "sticker";
    case "file":
    case "voice":
    case "video":
    case "other":
      return "file";
    default:
      return "text";
  }
}

function firstAttachment(m: ApiMessageWithReceipt) {
  return m.attachments?.[0];
}

export function mapApiMessageToChatRoom(
  m: ApiMessageWithReceipt,
  viewerId: string,
  peerDisplayName: string,
  replyLookup: Map<string, { senderLabel: string; preview: string }>,
): ChatRoomMessage {
  const senderRole = m.senderId === viewerId ? "me" : "peer";
  const isRemoved = Boolean(m.deletedAt);
  const base: ChatRoomMessage = {
    id: m.id,
    conversationId: m.conversationId,
    senderRole,
    createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString(),
    delivery: outgoingDelivery(m),
    kind: resolveKind(m),
    reactions: isRemoved ? [] : mapReactions(m.reactions),
    isRemoved,
    removalMode: m.deletionMode ?? undefined,
  };

  let replyTo: ReplyReference | undefined;
  if (m.replyToMessageId && !isRemoved) {
    const hit = replyLookup.get(m.replyToMessageId);
    replyTo = {
      id: m.replyToMessageId,
      senderLabel: hit?.senderLabel ?? "Tin nhắn",
      preview: hit?.preview ?? "",
    };
  }

  const kind = resolveKind(m);
  if (isRemoved) {
    return {
      ...base,
      kind: "text",
      body: m.deletionMode === "recalled" ? "Tin nhắn đã được thu hồi" : "Tin nhắn đã bị xóa",
    };
  }

  if (kind === "text") {
    return {
      ...base,
      kind: "text",
      body: m.content ?? (m.type === "system" ? "Thông báo" : ""),
      replyTo,
    };
  }

  if (kind === "sticker" && m.sticker) {
    return {
      ...base,
      kind: "sticker",
      stickerUrl: m.sticker.assetUrl,
      stickerId: m.sticker.id,
      stickerEmoji: m.sticker.code ?? undefined,
      replyTo,
    };
  }

  if (kind === "image") {
    const att = firstAttachment(m);
    const url = att ? publicUrlForStorageKey(att.storageKey) : "";
    return {
      ...base,
      kind: "image",
      imageUrl: url,
      imageWidth: att?.width ?? undefined,
      imageHeight: att?.height ?? undefined,
      body: m.content ?? undefined,
      replyTo,
    };
  }

  const att = firstAttachment(m);
  const size = att ? Number.parseInt(att.fileSize, 10) : 0;
  return {
    ...base,
    kind: "file",
    file: att
      ? {
          name: att.originalFileName,
          sizeBytes: Number.isFinite(size) ? size : 0,
          mime: att.mimeType,
        }
      : { name: "Tệp", sizeBytes: 0 },
    body: m.content ?? undefined,
    replyTo,
  };
}

export function mapApiMessagesToChatRoomList(
  apiMessages: ApiMessageWithReceipt[],
  viewerId: string,
  peerDisplayName: string,
): ChatRoomMessage[] {
  const sorted = [...apiMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const replyLookup = new Map<string, { senderLabel: string; preview: string }>();
  for (const m of sorted) {
    const label = m.senderId === viewerId ? "Bạn" : m.sender.displayName ?? peerDisplayName;
    replyLookup.set(m.id, { senderLabel: label, preview: previewLineFromApi(m) });
  }

  return sorted.map((m) => mapApiMessageToChatRoom(m, viewerId, peerDisplayName, replyLookup));
}

export function mergeReactionsFromSummary(
  summary: { counts: { reaction: string; count: number }[]; mine: string[] },
): MessageReaction[] {
  const mine = new Set(summary.mine ?? []);
  return (summary.counts ?? []).map((c) => ({
    emoji: c.reaction,
    count: c.count,
    reactedByMe: mine.has(c.reaction),
  }));
}

/** Socket broadcast: counts are global; keep each viewer's `reactedByMe` from prior state. */
export function mergeReactionsFromSocketBroadcast(
  prev: MessageReaction[] | undefined,
  summary: { counts: { reaction: string; count: number }[]; mine?: string[] },
): MessageReaction[] {
  if (summary.mine && summary.mine.length > 0) {
    return mergeReactionsFromSummary({
      counts: summary.counts ?? [],
      mine: summary.mine,
    });
  }
  const prevMe = new Map((prev ?? []).map((r) => [r.emoji, Boolean(r.reactedByMe)]));
  return (summary.counts ?? []).map((c) => ({
    emoji: c.reaction,
    count: c.count,
    reactedByMe: prevMe.get(c.reaction) ?? false,
  }));
}
