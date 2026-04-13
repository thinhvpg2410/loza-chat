/** Thread summary for the conversation list (middle column). */
export type Conversation = {
  id: string;
  title: string;
  avatarUrl?: string;
  lastMessagePreview: string;
  /** ISO timestamp of last activity (API); list formats to HH:mm / dd/mm / dd/mm/yy. */
  lastMessageAt: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isOnline?: boolean;
  lastSeenLabel?: string;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  viewerReacted?: boolean;
};

export type ReplyPreviewRef = {
  messageId: string;
  snippet: string;
  isOwn: boolean;
};

type MessageCommon = {
  id: string;
  conversationId: string;
  sentAt: string;
  createdAt: string;
  isOwn: boolean;
  /** Peer messages: sender display name for avatar fallback. */
  senderDisplayName?: string;
  /** Peer messages: public avatar URL from API. */
  senderAvatarUrl?: string;
  /** Direct chat: peer received this outgoing message (from API or realtime receipts). */
  peerDelivered?: boolean;
  /** Direct chat: peer read this outgoing message. */
  peerSeen?: boolean;
  reactions?: MessageReaction[];
  replyTo?: ReplyPreviewRef;
};

export type TextMessage = MessageCommon & {
  kind: "text";
  body: string;
};

export type ImageMessage = MessageCommon & {
  kind: "image";
  imageUrl: string;
  alt?: string;
  loading?: boolean;
};

export type FileMessage = MessageCommon & {
  kind: "file";
  fileName: string;
  fileSizeBytes: number;
  mimeType?: string;
  fileUrl?: string;
};

export type StickerMessage = MessageCommon & {
  kind: "sticker";
  stickerId: string;
  emoji: string;
  /** When set (e.g. API sticker asset), shown instead of emoji-only tile. */
  stickerImageUrl?: string;
};

export type SystemMessage = MessageCommon & {
  kind: "system";
  body: string;
};

export type Message = TextMessage | ImageMessage | FileMessage | StickerMessage | SystemMessage;

export type ConversationThread = {
  conversation: Conversation;
  messages: Message[];
};

export type MessageGroupPosition = "single" | "first" | "middle" | "last";
