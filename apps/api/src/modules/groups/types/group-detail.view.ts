import type { ConversationMemberRole } from '@prisma/client';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export interface GroupMemberView {
  userId: string;
  role: ConversationMemberRole;
  joinedAt: Date;
  user: PublicUserProfile;
}

export interface GroupDetailView {
  conversationId: string;
  title: string | null;
  avatarUrl: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  myRole: ConversationMemberRole;
  members: GroupMemberView[];
}
