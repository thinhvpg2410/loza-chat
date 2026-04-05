import type { ConversationType, MessageType } from '@prisma/client';
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
  otherParticipant: PublicUserProfile | null;
  myMembership: {
    joinedAt: Date;
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
