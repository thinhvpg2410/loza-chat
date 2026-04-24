"use client";

import { useMemo } from "react";
import type { ApiGroupDetail } from "@/lib/chat/api-dtos";
import type { GroupMember, GroupMemberRole } from "@/lib/types/social";

function asRole(r: string): GroupMemberRole {
  if (r === "owner" || r === "admin" || r === "member") return r;
  return "member";
}

export function useGroupMembers(detail: ApiGroupDetail | null, viewerUserId: string | null): {
  members: GroupMember[];
  pendingInviteMembers: GroupMember[];
} {
  return useMemo(() => {
    if (!detail) {
      return { members: [], pendingInviteMembers: [] };
    }
    const members: GroupMember[] = detail.members.map((m) => ({
      id: m.userId,
      userId: m.userId,
      displayName: m.user.displayName,
      username: m.user.username ?? "",
      role: asRole(m.role),
      avatarUrl: m.user.avatarUrl ?? undefined,
      isSelf: viewerUserId !== null && m.userId === viewerUserId,
    }));
    const pendingInviteMembers: GroupMember[] = detail.pendingMembers.map((m) => ({
      id: m.userId,
      userId: m.userId,
      displayName: m.user.displayName,
      username: m.user.username ?? "",
      role: asRole(m.role),
      avatarUrl: m.user.avatarUrl ?? undefined,
      isSelf: viewerUserId !== null && m.userId === viewerUserId,
    }));
    return { members, pendingInviteMembers };
  }, [detail, viewerUserId]);
}
