"use server";

import { apiFetchJson } from "@/lib/api/server";
import { getWebApiSession } from "@/lib/auth/web-api-session";
import type { ApiGroupDetail, ApiJoinQueueItem } from "@/lib/chat/api-dtos";

async function assertApiChatEnabled(): Promise<
  { ok: true; base: string } | { ok: false; error: string }
> {
  const session = await getWebApiSession();
  if (!session.active) {
    return { ok: false, error: "Chỉ khả dụng khi đăng nhập qua API." };
  }
  return { ok: true, base: session.baseUrl };
}

export type GroupDetailResult =
  | { ok: true; group: ApiGroupDetail }
  | { ok: false; error: string };

export async function fetchGroupDetailAction(conversationId: string): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(`/groups/${conversationId}`);
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tải được thông tin nhóm.",
    };
  }
}

export type CreateGroupResult =
  | { ok: true; group: ApiGroupDetail }
  | { ok: false; error: string };

export async function createGroupAction(input: {
  title: string;
  memberIds: string[];
  avatarUrl?: string;
}): Promise<CreateGroupResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>("/groups", {
      method: "POST",
      body: JSON.stringify({
        title: input.title.trim(),
        memberIds: input.memberIds,
        ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
      }),
    });
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tạo được nhóm.",
    };
  }
}

export type JoinQueueResult =
  | { ok: true; items: ApiJoinQueueItem[] }
  | { ok: false; error: string };

export async function fetchGroupJoinQueueAction(conversationId: string): Promise<JoinQueueResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { items } = await apiFetchJson<{ items: ApiJoinQueueItem[] }>(
      `/groups/${conversationId}/join-requests`,
    );
    return { ok: true, items };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tải được danh sách chờ duyệt.",
    };
  }
}

export async function approveGroupJoinRequestAction(
  conversationId: string,
  applicantUserId: string,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/join-requests/${applicantUserId}/approve`,
      { method: "POST", body: "{}" },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không duyệt được yêu cầu.",
    };
  }
}

export async function rejectGroupJoinRequestAction(
  conversationId: string,
  applicantUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    await apiFetchJson(`/groups/${conversationId}/join-requests/${applicantUserId}/reject`, {
      method: "POST",
      body: "{}",
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không từ chối được yêu cầu.",
    };
  }
}

export async function patchGroupProfileAction(input: {
  conversationId: string;
  title?: string;
  avatarUrl?: string | null;
}): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.avatarUrl !== undefined) body.avatarUrl = input.avatarUrl;
  if (Object.keys(body).length === 0) {
    return { ok: false, error: "Không có dữ liệu cập nhật." };
  }
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${input.conversationId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không cập nhật được nhóm.",
    };
  }
}

export async function updateGroupSettingsAction(
  conversationId: string,
  patch: Partial<ApiGroupDetail["settings"]>,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/settings`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không cập nhật được cài đặt.",
    };
  }
}

export async function addGroupMembersAction(
  conversationId: string,
  memberIds: string[],
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/members`,
      { method: "POST", body: JSON.stringify({ memberIds }) },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không thêm được thành viên.",
    };
  }
}

export async function removeGroupMemberAction(
  conversationId: string,
  targetUserId: string,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/members/${targetUserId}`,
      { method: "DELETE" },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không xóa được thành viên.",
    };
  }
}

export async function approveGroupMemberAction(
  conversationId: string,
  targetUserId: string,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/members/${targetUserId}/approve`,
      { method: "POST", body: "{}" },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không duyệt được thành viên.",
    };
  }
}

export async function rejectGroupMemberAction(
  conversationId: string,
  targetUserId: string,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/members/${targetUserId}/reject`,
      { method: "POST", body: "{}" },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không từ chối được yêu cầu.",
    };
  }
}

export async function updateGroupMemberRoleAction(
  conversationId: string,
  targetUserId: string,
  role: "admin" | "member",
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/members/${targetUserId}/role`,
      { method: "PATCH", body: JSON.stringify({ role }) },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không đổi được vai trò.",
    };
  }
}

export async function transferGroupOwnershipAction(
  conversationId: string,
  newOwnerUserId: string,
): Promise<GroupDetailResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { group } = await apiFetchJson<{ group: ApiGroupDetail }>(
      `/groups/${conversationId}/transfer-ownership`,
      { method: "POST", body: JSON.stringify({ newOwnerUserId }) },
    );
    return { ok: true, group };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không chuyển được quyền trưởng nhóm.",
    };
  }
}

export type DissolveGroupResult = { ok: true } | { ok: false; error: string };

export async function dissolveGroupAction(conversationId: string): Promise<DissolveGroupResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    await apiFetchJson(`/groups/${conversationId}`, { method: "DELETE" });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không giải tán được nhóm.",
    };
  }
}

export async function leaveGroupAction(conversationId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    await apiFetchJson(`/groups/${conversationId}/leave`, { method: "POST", body: "{}" });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không rời được nhóm.",
    };
  }
}
