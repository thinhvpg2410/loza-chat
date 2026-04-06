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
};

export type Message = {
  id: string;
  conversationId: string;
  body: string;
  sentAt: string;
  isOwn: boolean;
};
