/** Friend list and profile (replace with API models later). */

/** Mirrors API `RelationshipStatus` for UI logic. */
export type RelationshipStatus =
  | "self"
  | "none"
  | "outgoing_request"
  | "incoming_request"
  | "friend"
  | "blocked_by_me"
  | "blocked_me";

export type Friend = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  isOnline?: boolean;
  lastContactedAt?: string;
  friendshipId?: string;
  friendsSince?: string;
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
  /** Other user (sender for incoming, receiver for outgoing). */
  counterpartId?: string;
};

export type UserRelation = "none" | "friend" | "pending_out" | "pending_in";

export type SearchableUser = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  relation: UserRelation;
  /** When set (API search), drives add-friend row actions. */
  relationshipStatus?: RelationshipStatus;
};

export type ProfileUser = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  mutualFriendsCount?: number;
  isSelf?: boolean;
  relationshipStatus?: RelationshipStatus;
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
