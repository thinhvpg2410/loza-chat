import type { ApiAttachment, ApiMessageWithReceipt, ApiReactionSummary, ApiSticker } from "@/lib/chat/api-dtos";

/** Normalizes `message:new` payload (`MessageView` JSON) into the same shape as REST history rows. */
export function socketMessageViewToApiRow(raw: unknown, viewerUserId: string): ApiMessageWithReceipt {
  const m = raw as Record<string, unknown>;
  const id = String(m.id ?? "");
  const conversationId = String(m.conversationId ?? "");
  const senderObj = m.sender as { id?: unknown } | undefined;
  const senderId = String(
    m.senderId ?? (senderObj && typeof senderObj.id === "string" ? senderObj.id : ""),
  );
  const type = String(m.type ?? "text");
  const content = m.content == null ? null : String(m.content);
  const replyToMessageId =
    m.replyToMessageId == null || m.replyToMessageId === ""
      ? null
      : String(m.replyToMessageId);
  const createdAt =
    typeof m.createdAt === "string"
      ? m.createdAt
      : m.createdAt instanceof Date
        ? m.createdAt.toISOString()
        : new Date().toISOString();
  const updatedAt =
    typeof m.updatedAt === "string"
      ? m.updatedAt
      : m.updatedAt instanceof Date
        ? m.updatedAt.toISOString()
        : createdAt;

  const reactions = normalizeReactions(m.reactions);
  const attachments = Array.isArray(m.attachments)
    ? (m.attachments as ApiAttachment[])
    : [];
  const sticker = (m.sticker as ApiSticker | null | undefined) ?? null;

  const sentByViewer = senderId === viewerUserId;

  return {
    id,
    conversationId,
    senderId,
    type,
    content,
    replyToMessageId,
    createdAt,
    updatedAt,
    sentByViewer,
    attachments,
    sticker,
    reactions,
    deliveredToPeer: sentByViewer ? false : undefined,
    seenByPeer: sentByViewer ? false : undefined,
  };
}

function normalizeReactions(raw: unknown): ApiReactionSummary {
  if (!raw || typeof raw !== "object") {
    return { counts: [], mine: [] };
  }
  const o = raw as Record<string, unknown>;
  const countsRaw = o.counts;
  const counts = Array.isArray(countsRaw)
    ? countsRaw
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const row = c as Record<string, unknown>;
          const reaction = typeof row.reaction === "string" ? row.reaction : "";
          const count = typeof row.count === "number" ? row.count : Number(row.count);
          if (!reaction || !Number.isFinite(count)) return null;
          return { reaction, count };
        })
        .filter((x): x is { reaction: string; count: number } => x != null)
    : [];
  const mineRaw = o.mine;
  const mine = Array.isArray(mineRaw) ? mineRaw.filter((x): x is string => typeof x === "string") : [];
  return { counts, mine };
}
