import { attachmentReadUrl } from "@/lib/chat/attachment-public-url";
import type { ApiMessageWithReceipt } from "@/lib/chat/api-dtos";
import type {
  FileMessage,
  ImageMessage,
  Message,
  MessageReaction,
  ReplyPreviewRef,
  StickerMessage,
  SystemMessage,
  TextMessage,
} from "@/lib/types/chat";

function formatSentAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function mapReactions(r: ApiMessageWithReceipt["reactions"]): MessageReaction[] {
  return r.counts.map(({ reaction, count }) => ({
    emoji: reaction,
    count,
    viewerReacted: r.mine.includes(reaction),
  }));
}

function mapContentOnly(row: ApiMessageWithReceipt, apiBaseUrl: string): Message {
  const sentAt = formatSentAt(row.createdAt);
  const createdAt =
    typeof row.createdAt === "string" ? row.createdAt : new Date(row.createdAt).toISOString();
  const baseOwn = row.sentByViewer;
  const reactions = mapReactions(row.reactions);

  const receipt =
    baseOwn && (row.deliveredToPeer !== undefined || row.seenByPeer !== undefined)
      ? {
          peerDelivered: Boolean(row.deliveredToPeer),
          peerSeen: Boolean(row.seenByPeer),
        }
      : {};

  if (row.deletedAt) {
    const m: SystemMessage = {
      kind: "system",
      id: row.id,
      conversationId: row.conversationId,
      body: row.deletionMode === "recalled" ? "Tin nhắn đã được thu hồi" : "Tin nhắn đã bị xóa",
      sentAt,
      createdAt,
      isOwn: false,
      reactions: [],
    };
    return m;
  }

  switch (row.type) {
    case "text": {
      const m: TextMessage = {
        kind: "text",
        id: row.id,
        conversationId: row.conversationId,
        body: row.content?.trim() || "",
        sentAt,
        createdAt,
        isOwn: baseOwn,
        ...receipt,
        reactions,
      };
      return m;
    }
    case "sticker": {
      const st = row.sticker;
      const emoji = st?.code?.trim() || "🙂";
      const m: StickerMessage = {
        kind: "sticker",
        id: row.id,
        conversationId: row.conversationId,
        stickerId: st?.id ?? row.id,
        emoji,
        stickerImageUrl: st?.assetUrl,
        sentAt,
        createdAt,
        isOwn: baseOwn,
        ...receipt,
        reactions,
      };
      return m;
    }
    case "system": {
      const m: SystemMessage = {
        kind: "system",
        id: row.id,
        conversationId: row.conversationId,
        body: row.content?.trim() || "Thông báo",
        sentAt,
        createdAt,
        isOwn: false,
        reactions,
      };
      return m;
    }
    case "image": {
      const imgAtt = row.attachments.find((a) => a.attachmentType === "image");
      const url = imgAtt ? attachmentReadUrl(apiBaseUrl, imgAtt) : "";
      const m: ImageMessage = {
        kind: "image",
        id: row.id,
        conversationId: row.conversationId,
        imageUrl: url,
        alt: row.content?.trim() || imgAtt?.originalFileName || "Ảnh",
        loading: !url,
        sentAt,
        createdAt,
        isOwn: baseOwn,
        ...receipt,
        reactions,
      };
      return m;
    }
    case "file":
    case "voice":
    case "video":
    case "other": {
      const att = row.attachments[0];
      const fileName =
        att?.originalFileName ||
        (row.type === "voice" ? "Ghi âm" : row.type === "video" ? "Video" : "Tệp đính kèm");
      const size = att ? Number.parseInt(att.fileSize, 10) : 0;
      const m: FileMessage = {
        kind: "file",
        id: row.id,
        conversationId: row.conversationId,
        fileName,
        fileSizeBytes: Number.isFinite(size) ? size : 0,
        mimeType: att?.mimeType,
        fileUrl: att ? attachmentReadUrl(apiBaseUrl, att) : undefined,
        sentAt,
        createdAt,
        isOwn: baseOwn,
        ...receipt,
        reactions,
      };
      return m;
    }
    default: {
      const m: TextMessage = {
        kind: "text",
        id: row.id,
        conversationId: row.conversationId,
        body: row.content?.trim() || "[Tin nhắn]",
        sentAt,
        createdAt,
        isOwn: baseOwn,
        ...receipt,
        reactions,
      };
      return m;
    }
  }
}

function withReply(
  msg: Message,
  row: ApiMessageWithReceipt,
  byIdMsg: Map<string, Message>,
  byIdRaw: Map<string, ApiMessageWithReceipt>,
): Message {
  if (!row.replyToMessageId) return msg;
  const parentMsg = byIdMsg.get(row.replyToMessageId);
  const parentRaw = byIdRaw.get(row.replyToMessageId);
  const snippet = parentMsg
    ? snippetFromMessage(parentMsg)
    : parentRaw?.content?.trim() || "Tin nhắn";
  const isOwn = parentRaw?.sentByViewer ?? false;
  const replyTo: ReplyPreviewRef = {
    messageId: row.replyToMessageId,
    snippet,
    isOwn,
  };
  if (msg.kind === "system") return msg;
  return { ...msg, replyTo };
}

function snippetFromMessage(m: Message): string {
  switch (m.kind) {
    case "text":
      return m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body;
    case "image":
      return "[Ảnh]";
    case "file":
      return m.fileName;
    case "sticker":
      return m.emoji;
    case "system":
      return m.body;
    default:
      return "";
  }
}

/** Maps API history page to UI messages (chronological). */
export function mapApiMessagesToChatMessages(
  rows: ApiMessageWithReceipt[],
  apiBaseUrl: string,
): Message[] {
  const byIdRaw = new Map(rows.map((r) => [r.id, r]));
  const chronological = [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const byIdMsg = new Map<string, Message>();
  const ordered: Message[] = [];
  for (const row of chronological) {
    const mapped = mapContentOnly(row, apiBaseUrl);
    byIdMsg.set(row.id, mapped);
    ordered.push(mapped);
  }
  return ordered.map((msg) => {
    const raw = byIdRaw.get(msg.id);
    if (!raw) return msg;
    return withReply(msg, raw, byIdMsg, byIdRaw);
  });
}

export function mapSingleApiMessage(row: ApiMessageWithReceipt, apiBaseUrl: string): Message {
  const list = mapApiMessagesToChatMessages([row], apiBaseUrl);
  return list[0]!;
}
