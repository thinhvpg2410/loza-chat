import type {
  ConversationMemberRole,
  ConversationType,
  MessageType,
} from '@prisma/client';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export interface ConversationLastMessagePreview {
  id: string;
  type: MessageType;
  contentPreview: string | null;
  createdAt: Date;
  senderId: string;
}

export interface ConversationListItemView {
  conversationId: string;
  type: ConversationType;
  /** Group title; null for direct chats. */
  title: string | null;
  /** Group avatar; null for direct chats. */
  avatarUrl: string | null;
  /** Total members including the viewer. */
  memberCount: number;
  updatedAt: Date;
  mutedUntil: Date | null;
  otherParticipant: PublicUserProfile | null;
  lastMessage: ConversationLastMessagePreview | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  lastDeliveredMessageId: string | null;
}

export interface ConversationDetailView {
  id: string;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  avatarUrl: string | null;
  memberCount: number;
  otherParticipant: PublicUserProfile | null;
  myMembership: {
    joinedAt: Date;
    role: ConversationMemberRole | null;
    lastReadMessageId: string | null;
    lastDeliveredMessageId: string | null;
    mutedUntil: Date | null;
  };
}

export interface ConversationMemberProgressPublic {
  userId: string;
  lastReadMessageId: string | null;
  lastDeliveredMessageId: string | null;
}

export interface ConversationStateView {
  conversationId: string;
  type: ConversationType;
  updatedAt: Date;
  lastMessageId: string | null;
  me: ConversationMemberProgressPublic;
  peer: ConversationMemberProgressPublic | null;
  unreadCount: number;
}

export interface ConversationProgressResponse {
  state: ConversationStateView;
}
