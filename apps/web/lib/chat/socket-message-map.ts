import type {
  ApiAttachment,
  ApiMessageWithReceipt,
  ApiPublicUser,
  ApiReactionSummary,
  ApiSticker,
} from "@/lib/chat/api-dtos";

function parseSenderPayload(raw: unknown): ApiPublicUser | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  if (!id) return undefined;
  const displayName = typeof o.displayName === "string" ? o.displayName : "";
  const username = o.username == null || o.username === "" ? null : String(o.username);
  const avatarUrl =
    o.avatarUrl == null || o.avatarUrl === "" ? null : String(o.avatarUrl);
  return { id, displayName, username, avatarUrl };
}

/** Normalizes `message:new` payload (`MessageView` JSON) into the same shape as REST history rows. */
export function socketMessageViewToApiRow(
  raw: unknown,
  viewerUserId: string,
): ApiMessageWithReceipt | null {
  const m = raw as Record<string, unknown>;
  const id = String(m.id ?? "");
  const conversationId = String(m.conversationId ?? "");
  const senderObj = m.sender as { id?: unknown } | undefined;
  const senderId = String(
    m.senderId ?? (senderObj && typeof senderObj.id === "string" ? senderObj.id : ""),
  );
  if (!id || !conversationId || !senderId) {
    return null;
  }
  const type = String(m.type ?? "text");
  const content = m.content == null ? null : String(m.content);
  const metadataJson =
    m.metadataJson && typeof m.metadataJson === "object"
      ? (m.metadataJson as Record<string, unknown>)
      : null;
  const deletedAt =
    typeof m.deletedAt === "string"
      ? m.deletedAt
      : m.deletedAt instanceof Date
        ? m.deletedAt.toISOString()
        : null;
  const deletionModeRaw = m.deletionMode;
  const deletionMode =
    deletionModeRaw === "recalled" || deletionModeRaw === "deleted" ? deletionModeRaw : null;
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
  const sender = parseSenderPayload(m.sender);

  return {
    id,
    conversationId,
    senderId,
    sender,
    type,
    content,
    metadataJson,
    deletedAt,
    deletionMode,
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
