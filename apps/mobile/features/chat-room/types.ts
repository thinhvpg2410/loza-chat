/**
 * Chat room message model — text, media, stickers, replies, reactions (realtime-ready).
 */
export type MessageSenderRole = "me" | "peer";

export type OutgoingDeliveryState = "sending" | "sent" | "delivered" | "seen";

export type MessageKind = "text" | "image" | "file" | "sticker";

export type ReplyReference = {
  id: string;
  senderLabel: string;
  /** Short preview line */
  preview: string;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  /** True if the current user added this emoji */
  reactedByMe?: boolean;
};

export type ChatRoomMessage = {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  createdAt: string;
  delivery?: OutgoingDeliveryState;
  kind: MessageKind;
  /** Primary text (text messages) or optional caption */
  body?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  file?: {
    name: string;
    sizeBytes: number;
    mime?: string;
  };
  /** Remote sticker asset — or use stickerEmoji for simple mock */
  stickerUrl?: string;
  stickerId?: string;
  stickerEmoji?: string;
  replyTo?: ReplyReference;
  reactions?: MessageReaction[];
  isRemoved?: boolean;
  removalMode?: "recalled" | "deleted";
};

export type MessageFeedItem =
  | { kind: "separator"; key: string; label: string }
  | { kind: "group"; key: string; messages: ChatRoomMessage[]; role: MessageSenderRole };
