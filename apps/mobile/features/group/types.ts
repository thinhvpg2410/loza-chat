export type GroupMemberRole = "owner" | "admin" | "member";

export type GroupMember = {
  id: string;
  name: string;
  avatarUrl: string;
  role: GroupMemberRole;
};

export type GroupDetail = {
  conversationId: string;
  name: string;
  avatarUrl: string;
  memberCount: number;
  members: GroupMember[];
};
