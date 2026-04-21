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
  /** Trưởng / phó đổi tên nhóm (theo API). */
  canRenameGroup: boolean;
  /** Chỉ trưởng nhóm đổi ảnh nhóm. */
  canEditGroupAvatar: boolean;
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
  const canChangeSettings = isLeader || isDeputy;
  const canDissolve = isLeader;
  const onlyAdminsAdd = Boolean(s.onlyAdminsCanAddMembers);
  const onlyAdminsRemove = Boolean(s.onlyAdminsCanRemoveMembers);
  const canAddMembers = !onlyAdminsAdd || canModerateMembers;
  const canRemoveMembers = !onlyAdminsRemove || canModerateMembers;
  const active = myStatus === "active";
  const canRenameGroup = active && (isLeader || isDeputy);
  const canEditGroupAvatar = active && isLeader;

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
    canRenameGroup,
    canEditGroupAvatar,
  };
}

export function roleDisplayLabel(role: string): string {
  if (role === "owner") return "Trưởng nhóm";
  if (role === "admin") return "Phó nhóm";
  return "Thành viên";
}
