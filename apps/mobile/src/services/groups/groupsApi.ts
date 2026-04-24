import { apiClient } from "@/services/api/client";

import type { PublicUserProfileDto } from "../users/usersPublicApi";

export type GroupSettingsDto = {
  onlyAdminsCanPost: boolean;
  joinApprovalRequired: boolean;
  onlyAdminsCanAddMembers: boolean;
  onlyAdminsCanRemoveMembers: boolean;
  moderatorsCanRecallMessages?: boolean;
};

export type GroupJoinQueueItemDto = {
  kind: "self_request" | "invite_pending";
  userId: string;
  createdAt: string;
};

export type GroupMemberDto = {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: PublicUserProfileDto;
};

export type GroupDetailDto = {
  conversationId: string;
  title: string | null;
  avatarUrl: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  myRole: string;
  myStatus: string;
  settings: GroupSettingsDto;
  members: GroupMemberDto[];
  pendingMembers: GroupMemberDto[];
};

export async function createGroupApi(input: {
  title: string;
  memberIds: string[];
  avatarUrl?: string;
}): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>("/groups", input);
  return data;
}

export async function fetchGroupDetailApi(conversationId: string): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.get<{ group: GroupDetailDto }>(`/groups/${conversationId}`);
  return data;
}

export async function updateGroupSettingsApi(
  conversationId: string,
  patch: Partial<GroupSettingsDto>,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.patch<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/settings`,
    patch,
  );
  return data;
}

export async function addGroupMembersApi(
  conversationId: string,
  memberIds: string[],
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/members`,
    { memberIds },
  );
  return data;
}

export async function removeGroupMemberApi(
  conversationId: string,
  targetUserId: string,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.delete<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/members/${targetUserId}`,
  );
  return data;
}

export async function approveGroupMemberApi(
  conversationId: string,
  targetUserId: string,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/members/${targetUserId}/approve`,
    {},
  );
  return data;
}

export async function rejectGroupMemberApi(
  conversationId: string,
  targetUserId: string,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/members/${targetUserId}/reject`,
    {},
  );
  return data;
}

export async function updateGroupMemberRoleApi(
  conversationId: string,
  targetUserId: string,
  role: "admin" | "member",
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.patch<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/members/${targetUserId}/role`,
    { role },
  );
  return data;
}

export async function transferGroupOwnershipApi(
  conversationId: string,
  newOwnerUserId: string,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/transfer-ownership`,
    { newOwnerUserId },
  );
  return data;
}

export async function dissolveGroupApi(conversationId: string): Promise<void> {
  await apiClient.delete(`/groups/${conversationId}`);
}

export async function leaveGroupApi(conversationId: string): Promise<void> {
  await apiClient.post(`/groups/${conversationId}/leave`, {});
}

export async function fetchGroupJoinQueueApi(
  conversationId: string,
): Promise<{ items: GroupJoinQueueItemDto[] }> {
  const { data } = await apiClient.get<{ items: GroupJoinQueueItemDto[] }>(
    `/groups/${conversationId}/join-requests`,
  );
  return { items: data.items ?? [] };
}

export async function approveGroupJoinRequestApi(
  conversationId: string,
  applicantUserId: string,
): Promise<{ group: GroupDetailDto }> {
  const { data } = await apiClient.post<{ group: GroupDetailDto }>(
    `/groups/${conversationId}/join-requests/${applicantUserId}/approve`,
    {},
  );
  return data;
}

export async function rejectGroupJoinRequestApi(
  conversationId: string,
  applicantUserId: string,
): Promise<void> {
  await apiClient.post(`/groups/${conversationId}/join-requests/${applicantUserId}/reject`, {});
}

export async function patchGroupProfileApi(input: {
  conversationId: string;
  title?: string;
  avatarUrl?: string | null;
}): Promise<{ group: GroupDetailDto }> {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.avatarUrl !== undefined) body.avatarUrl = input.avatarUrl;
  const { data } = await apiClient.patch<{ group: GroupDetailDto }>(
    `/groups/${input.conversationId}`,
    body,
  );
  return data;
}
