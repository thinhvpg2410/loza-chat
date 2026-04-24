/** Narrow shapes returned by Loza API (JSON). */

export type ApiPublicUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
};

export type ApiGroupSettings = {
  onlyAdminsCanPost: boolean;
  joinApprovalRequired: boolean;
  onlyAdminsCanAddMembers: boolean;
  onlyAdminsCanRemoveMembers: boolean;
  moderatorsCanRecallMessages: boolean;
};

/** Pending join queue item from `GET /groups/:id/join-requests`. */
export type ApiJoinQueueItem = {
  kind: "self_request" | "invite_pending";
  userId: string;
  createdAt: string;
};

export type ApiGroupMember = {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: ApiPublicUser;
};

export type ApiGroupDetail = {
  conversationId: string;
  title: string | null;
  avatarUrl: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  myRole: string;
  myStatus: string;
  settings: ApiGroupSettings;
  members: ApiGroupMember[];
  pendingMembers: ApiGroupMember[];
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
  /** Present on API list for direct threads. */
  directPeerRelationshipStatus?: string | null;
};

export type ApiAttachment = {
  id: string;
  storageKey: string;
  /** When set (S3/CDN or mock-public), use this instead of constructing mock-public from `storageKey`. */
  publicUrl?: string | null;
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
  /** Present on API / socket `MessageView` rows; used for peer avatars in the thread. */
  sender?: ApiPublicUser;
  type: string;
  content: string | null;
  metadataJson?: Record<string, unknown> | null;
  deletedAt?: string | null;
  deletionMode?: "recalled" | "deleted" | null;
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
