/** Friend list and profile (replace with API models later). */

export type Friend = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  isOnline?: boolean;
  lastContactedAt?: string;
};

export type FriendRequestDirection = "incoming" | "outgoing";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export type FriendRequest = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  message?: string;
  direction: FriendRequestDirection;
  status: FriendRequestStatus;
};

export type UserRelation = "none" | "friend" | "pending_out" | "pending_in";

export type SearchableUser = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  relation: UserRelation;
};

export type ProfileUser = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  bio?: string;
  mutualFriendsCount?: number;
  isSelf?: boolean;
};

export type GroupMemberRole = "owner" | "admin" | "member";

export type GroupMember = {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  role: GroupMemberRole;
  online?: boolean;
};

export type GroupSummary = {
  id: string;
  name: string;
  avatarUrl?: string;
  memberCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  muted?: boolean;
};

export type FriendListFilter = "all" | "online" | "recent";
