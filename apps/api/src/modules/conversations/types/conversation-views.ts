import type { ConversationType } from '@prisma/client';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export interface ConversationLastMessagePreview {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
}

export interface ConversationListItemView {
  conversationId: string;
  type: ConversationType;
  updatedAt: Date;
  otherParticipant: PublicUserProfile | null;
  lastMessage: ConversationLastMessagePreview | null;
  unreadCount: number;
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
