/** Thread summary for the conversation list (middle column). */
export type Conversation = {
  id: string;
  title: string;
  avatarUrl?: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isOnline?: boolean;
  /** Shown under name when not online, e.g. "Hoạt động 5 phút trước" */
  lastSeenLabel?: string;
};

/** Single text message in a thread (right panel). */
export type Message = {
  id: string;
  conversationId: string;
  body: string;
  /** Short time for bubble footer, e.g. "09:18" */
  sentAt: string;
  /** ISO-8601 for ordering and date separators */
  createdAt: string;
  isOwn: boolean;
};

/** Full thread for mock store / future API. */
export type ConversationThread = {
  conversation: Conversation;
  messages: Message[];
};
