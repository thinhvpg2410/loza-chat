import type { MessageType, Prisma } from '@prisma/client';
import type { AttachmentPublicDto } from '../../uploads/dto/upload-complete-response.dto';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';
import type { StickerPublicDto } from '../../stickers/dto/sticker-public.dto';

export interface ReactionSummaryView {
  counts: { reaction: string; count: number }[];
  mine: string[];
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  type: MessageType;
  content: string | null;
  metadataJson: Prisma.JsonValue | null;
  deletedAt: Date | null;
  deletionMode: 'recalled' | 'deleted' | null;
  replyToMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender: PublicUserProfile;
  attachments: AttachmentPublicDto[];
  sticker: StickerPublicDto | null;
  reactions: ReactionSummaryView;
}

/** Message row plus derived receipt hints for direct chat (peer pointers on `ConversationMember`). */
export interface MessageWithReceiptStateView extends MessageView {
  sentByViewer: boolean;
  /** Meaningful when `sentByViewer`: peer's delivered pointer is at or after this message. */
  deliveredToPeer: boolean;
  /** Meaningful when `sentByViewer`: peer's read pointer is at or after this message. */
  seenByPeer: boolean;
}
