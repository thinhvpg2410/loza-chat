import type { ApiGroupDetail } from "@/lib/chat/api-dtos";

/** UI labels aligned with product wording (API uses owner/admin/member). */
export type GroupDisplayRole = "leader" | "deputy" | "member";

export function apiRoleToDisplay(role: string): GroupDisplayRole {
  if (role === "owner") return "leader";
  if (role === "admin") return "deputy";
  return "member";
}

export function displayRoleLabel(role: GroupDisplayRole): string {
  if (role === "leader") return "Trưởng nhóm";
  if (role === "deputy") return "Phó nhóm";
  return "Thành viên";
}

export type GroupPermissionFlags = {
  viewerId: string | null;
  isLeader: boolean;
  isDeputy: boolean;
  isMemberOnly: boolean;
  isPendingSelf: boolean;
  /** Maps to API `onlyAdminsCanPost`. */
  onlyLeaderDeputyCanChat: boolean;
  joinApprovalRequired: boolean;
  canModerateMembers: boolean;
  canEditGroupProfile: boolean;
  canEditAvatar: boolean;
  canChangeSettings: boolean;
  canDissolve: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
};

export function buildGroupPermissionFlags(
  detail: ApiGroupDetail | null,
  viewerId: string | null,
): GroupPermissionFlags {
  const myRole = detail?.myRole ?? "member";
  const myStatus = detail?.myStatus ?? "active";
  const s = detail?.settings;
  const onlyLeaderDeputyCanChat = Boolean(s?.onlyAdminsCanPost);
  const joinApprovalRequired = Boolean(s?.joinApprovalRequired);
  const isLeader = myRole === "owner";
  const isDeputy = myRole === "admin";
  const isMemberOnly = myRole === "member";
  const isPendingSelf = myStatus === "pending";

  const canModerateMembers = isLeader || isDeputy;
  const canEditGroupProfile = canModerateMembers;
  const canEditAvatar = isLeader;
  const canChangeSettings = isLeader;
  const canDissolve = isLeader;
  const onlyAdminsAdd = Boolean(s?.onlyAdminsCanAddMembers);
  const onlyAdminsRemove = Boolean(s?.onlyAdminsCanRemoveMembers);
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
    canEditGroupProfile,
    canEditAvatar,
    canChangeSettings,
    canDissolve,
    canAddMembers,
    canRemoveMembers,
  };
}
