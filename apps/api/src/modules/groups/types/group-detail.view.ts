import type {
  ConversationMemberRole,
  ConversationMemberStatus,
} from '@prisma/client';
import type { PublicUserProfile } from '../../../common/types/public-user-profile';
import type { GroupSettingsView } from './group-settings.view';

export interface GroupMemberView {
  userId: string;
  role: ConversationMemberRole;
  status: ConversationMemberStatus;
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
  myStatus: ConversationMemberStatus;
  settings: GroupSettingsView;
  members: GroupMemberView[];
  /** Owner/admin only: users waiting for approval */
  pendingMembers: GroupMemberView[];
}
