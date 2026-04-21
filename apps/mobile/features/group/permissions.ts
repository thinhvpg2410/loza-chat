import type { GroupDetailDto } from "@/services/groups/groupsApi";

export type GroupPermissionFlags = {
  viewerId: string;
  isLeader: boolean;
  isDeputy: boolean;
  isMemberOnly: boolean;
  isPendingSelf: boolean;
  onlyLeaderDeputyCanChat: boolean;
  joinApprovalRequired: boolean;
  canModerateMembers: boolean;
  canChangeSettings: boolean;
  canDissolve: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
};

export function buildGroupPermissionFlags(
  detail: GroupDetailDto | null,
  viewerId: string,
): GroupPermissionFlags | null {
  if (!detail) return null;
  const myRole = detail.myRole;
  const myStatus = detail.myStatus;
  const s = detail.settings;
  const onlyLeaderDeputyCanChat = Boolean(s.onlyAdminsCanPost);
  const joinApprovalRequired = Boolean(s.joinApprovalRequired);
  const isLeader = myRole === "owner";
  const isDeputy = myRole === "admin";
  const isMemberOnly = myRole === "member";
  const isPendingSelf = myStatus === "pending";

  const canModerateMembers = isLeader || isDeputy;
  const canChangeSettings = isLeader;
  const canDissolve = isLeader;
  const onlyAdminsAdd = Boolean(s.onlyAdminsCanAddMembers);
  const onlyAdminsRemove = Boolean(s.onlyAdminsCanRemoveMembers);
  const canAddMembers = !onlyAdminsAdd || canModerateMembers;
  const canRemoveMembers = !onlyAdminsRemove || canModerateMembers;

  return {
    viewerId,
    isLeader,
    isDeputy,
    isMemberOnly,
    isPendingSelf,
    onlyLeaderDeputyCanChat,
    joinApprovalRequired,
    canModerateMembers,
    canChangeSettings,
    canDissolve,
    canAddMembers,
    canRemoveMembers,
  };
}

export function roleDisplayLabel(role: string): string {
  if (role === "owner") return "Trưởng nhóm";
  if (role === "admin") return "Phó nhóm";
  return "Thành viên";
}
