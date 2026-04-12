/** Narrow shapes returned by Loza API (JSON). */

export type ApiPublicUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
};

export type ApiConversationListItem = {
  conversationId: string;
  type: string;
  title: string | null;
  avatarUrl: string | null;
  memberCount: number;
  updatedAt: string;
  mutedUntil: string | null;
  otherParticipant: ApiPublicUser | null;
  lastMessage: {
    id: string;
    type: string;
    contentPreview: string | null;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
};

export type ApiAttachment = {
  id: string;
  storageKey: string;
  mimeType: string;
  originalFileName: string;
  fileSize: string;
  attachmentType: string;
};

export type ApiSticker = {
  id: string;
  code: string | null;
  name: string;
  assetUrl: string;
};

export type ApiReactionSummary = {
  counts: { reaction: string; count: number }[];
  mine: string[];
};

export type ApiMessageWithReceipt = {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content: string | null;
  replyToMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  sentByViewer: boolean;
  /** Direct chat: peer’s delivered pointer is at or after this message (own sends only). */
  deliveredToPeer?: boolean;
  /** Direct chat: peer’s read pointer is at or after this message (own sends only). */
  seenByPeer?: boolean;
  attachments: ApiAttachment[];
  sticker: ApiSticker | null;
  reactions: ApiReactionSummary;
};
