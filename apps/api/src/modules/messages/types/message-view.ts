import type { MessageType } from '@prisma/client';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  type: MessageType;
  content: string;
  replyToMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender: PublicUserProfile;
}
