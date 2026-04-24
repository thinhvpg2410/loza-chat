"use server";

import { revalidatePath } from "next/cache";
import { apiFetchJson } from "@/lib/api/server";
import type {
  ApiBlockedListEntry,
  ApiFriendListEntry,
  ApiIncomingRequest,
  ApiOutgoingRequest,
  ApiPublicProfile,
  ApiSearchResult,
} from "@/lib/friends/api-dtos";
import type { RelationshipStatus } from "@/lib/types/social";
import { getSocialApiContext } from "@/lib/friends/social-api-context";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Friend graph changes can add/remove direct threads; refresh chat RSC data. */
function revalidateFriendsViews() {
  revalidatePath("/friends");
  revalidatePath("/friends/requests");
  revalidatePath("/friends/blocked");
  revalidatePath("/");
}

async function assertFriendsApi(): Promise<ActionResult & { base?: never }> {
  const ctx = await getSocialApiContext();
  if (!ctx.ok) {
    return { ok: false, error: "Đăng nhập qua API để dùng tính năng này." };
  }
  return { ok: true };
}

export async function fetchFriendsListAction(): Promise<
  { ok: true; friends: ApiFriendListEntry[] } | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const { friends } = await apiFetchJson<{ friends: ApiFriendListEntry[] }>("/friends");
    return { ok: true, friends };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không tải được danh sách bạn bè." };
  }
}

export async function fetchIncomingRequestsAction(): Promise<
  { ok: true; requests: ApiIncomingRequest[] } | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const { requests } = await apiFetchJson<{ requests: ApiIncomingRequest[] }>(
      "/friends/requests/incoming",
    );
    return { ok: true, requests };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không tải được lời mời đến." };
  }
}

export async function fetchSocialNavCountsAction(): Promise<
  { ok: true; incomingFriendRequests: number } | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return { ok: true, incomingFriendRequests: 0 };
  try {
    const { requests } = await apiFetchJson<{ requests: ApiIncomingRequest[] }>(
      "/friends/requests/incoming",
    );
    return { ok: true, incomingFriendRequests: requests.length };
  } catch {
    return { ok: true, incomingFriendRequests: 0 };
  }
}

export async function fetchBlockedUsersAction(): Promise<
  { ok: true; blocks: ApiBlockedListEntry[] } | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const { blocks } = await apiFetchJson<{ blocks: ApiBlockedListEntry[] }>("/blocks");
    return { ok: true, blocks: blocks ?? [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không tải được danh sách chặn." };
  }
}

export async function fetchOutgoingRequestsAction(): Promise<
  { ok: true; requests: ApiOutgoingRequest[] } | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const { requests } = await apiFetchJson<{ requests: ApiOutgoingRequest[] }>(
      "/friends/requests/outgoing",
    );
    return { ok: true, requests };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không tải được lời mời đi." };
  }
}

export async function searchUsersExactAction(
  kind: "phoneNumber" | "email" | "username",
  value: string,
): Promise<{ ok: true; results: ApiSearchResult[] } | { ok: false; error: string }> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  const v = value.trim();
  if (!v) return { ok: false, error: "Nhập giá trị tìm kiếm." };
  const q =
    kind === "phoneNumber"
      ? `phoneNumber=${encodeURIComponent(v)}`
      : kind === "email"
        ? `email=${encodeURIComponent(v)}`
        : `username=${encodeURIComponent(v.toLowerCase())}`;
  try {
    const { results } = await apiFetchJson<{ results: ApiSearchResult[] }>(`/users/search?${q}`);
    return { ok: true, results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Tìm kiếm thất bại." };
  }
}

export async function sendFriendRequestAction(
  receiverId: string,
  message?: string,
): Promise<ActionResult & { requestId?: string }> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const body: Record<string, string> = { receiverId };
    if (message?.trim()) body.message = message.trim();
    const res = await apiFetchJson<{ message: string; id: string }>("/friends/request", {
      method: "POST",
      body: JSON.stringify(body),
    });
    revalidatePath("/friends");
    revalidatePath("/friends/requests");
    return { ok: true, requestId: res.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không gửi được lời mời." };
  }
}

export async function acceptFriendRequestAction(requestId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/friends/request/${requestId}/accept`, { method: "POST", body: "{}" });
    revalidateFriendsViews();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không chấp nhận được." };
  }
}

export async function rejectFriendRequestAction(requestId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/friends/request/${requestId}/reject`, { method: "POST", body: "{}" });
    revalidatePath("/friends");
    revalidatePath("/friends/requests");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không từ chối được." };
  }
}

export async function cancelFriendRequestAction(requestId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/friends/request/${requestId}/cancel`, { method: "POST", body: "{}" });
    revalidatePath("/friends/requests");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thu hồi được." };
  }
}

export async function unfriendAction(otherUserId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/friends/${otherUserId}`, { method: "DELETE" });
    revalidateFriendsViews();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không hủy kết bạn được." };
  }
}

export async function blockUserAction(blockedId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/blocks`, {
      method: "POST",
      body: JSON.stringify({ blockedId }),
    });
    revalidateFriendsViews();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không chặn được." };
  }
}

export async function unblockUserAction(blockedId: string): Promise<ActionResult> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    await apiFetchJson(`/blocks/${blockedId}`, { method: "DELETE" });
    revalidateFriendsViews();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không bỏ chặn được." };
  }
}

export async function getPublicProfileAction(
  targetUserId: string,
): Promise<
  | { ok: true; profile: ApiPublicProfile; relationshipStatus: RelationshipStatus }
  | { ok: false; error: string }
> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return gate;
  try {
    const data = await apiFetchJson<{
      profile: ApiPublicProfile;
      relationshipStatus: ApiSearchResult["relationshipStatus"];
    }>(`/users/${targetUserId}/public-profile`);
    return { ok: true, profile: data.profile, relationshipStatus: data.relationshipStatus };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tải được hồ sơ.",
    };
  }
}

export async function resolveFriendRequestIdsForUserAction(otherUserId: string): Promise<{
  incomingRequestId: string | null;
  outgoingRequestId: string | null;
}> {
  const gate = await assertFriendsApi();
  if (!gate.ok) return { incomingRequestId: null, outgoingRequestId: null };
  try {
    const [inc, out] = await Promise.all([
      apiFetchJson<{ requests: ApiIncomingRequest[] }>("/friends/requests/incoming"),
      apiFetchJson<{ requests: ApiOutgoingRequest[] }>("/friends/requests/outgoing"),
    ]);
    const incomingRequestId =
      inc.requests.find((r) => r.sender.id === otherUserId)?.id ?? null;
    const outgoingRequestId =
      out.requests.find((r) => r.receiver.id === otherUserId)?.id ?? null;
    return { incomingRequestId, outgoingRequestId };
  } catch {
    return { incomingRequestId: null, outgoingRequestId: null };
  }
}

export async function acceptIncomingForUserAction(senderUserId: string): Promise<ActionResult> {
  const { incomingRequestId } = await resolveFriendRequestIdsForUserAction(senderUserId);
  if (!incomingRequestId) return { ok: false, error: "Không tìm thấy lời mời." };
  return acceptFriendRequestAction(incomingRequestId);
}

export async function rejectIncomingForUserAction(senderUserId: string): Promise<ActionResult> {
  const { incomingRequestId } = await resolveFriendRequestIdsForUserAction(senderUserId);
  if (!incomingRequestId) return { ok: false, error: "Không tìm thấy lời mời." };
  return rejectFriendRequestAction(incomingRequestId);
}

export async function cancelOutgoingForUserAction(receiverUserId: string): Promise<ActionResult> {
  const { outgoingRequestId } = await resolveFriendRequestIdsForUserAction(receiverUserId);
  if (!outgoingRequestId) return { ok: false, error: "Không tìm thấy lời mời đã gửi." };
  return cancelFriendRequestAction(outgoingRequestId);
}
