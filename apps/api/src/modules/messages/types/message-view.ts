import type { MessageType } from '@prisma/client';
import type { AttachmentPublicDto } from '../../uploads/dto/upload-complete-response.dto';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  type: MessageType;
  content: string | null;
  replyToMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender: PublicUserProfile;
  attachments: AttachmentPublicDto[];
}

/** Message row plus derived receipt hints for direct chat (peer pointers on `ConversationMember`). */
export interface MessageWithReceiptStateView extends MessageView {
  sentByViewer: boolean;
  /** Meaningful when `sentByViewer`: peer's delivered pointer is at or after this message. */
  deliveredToPeer: boolean;
  /** Meaningful when `sentByViewer`: peer's read pointer is at or after this message. */
  seenByPeer: boolean;
}
