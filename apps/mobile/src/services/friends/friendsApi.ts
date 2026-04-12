import { apiClient } from "@/services/api/client";

import type { PublicUserProfileDto } from "../users/usersPublicApi";

export type FriendListEntryDto = PublicUserProfileDto & {
  friendshipId: string;
  friendsSince: string;
};

export type IncomingFriendRequestDto = {
  id: string;
  message: string | null;
  createdAt: string;
  sender: PublicUserProfileDto;
};

export type OutgoingFriendRequestDto = {
  id: string;
  message: string | null;
  createdAt: string;
  receiver: PublicUserProfileDto;
};

export async function fetchFriendsListApi(): Promise<FriendListEntryDto[]> {
  const { data } = await apiClient.get<{ friends: FriendListEntryDto[] }>("/friends");
  return data.friends ?? [];
}

export async function fetchIncomingFriendRequestsApi(): Promise<IncomingFriendRequestDto[]> {
  const { data } = await apiClient.get<{ requests: IncomingFriendRequestDto[] }>("/friends/requests/incoming");
  return data.requests ?? [];
}

export async function fetchOutgoingFriendRequestsApi(): Promise<OutgoingFriendRequestDto[]> {
  const { data } = await apiClient.get<{ requests: OutgoingFriendRequestDto[] }>("/friends/requests/outgoing");
  return data.requests ?? [];
}

export async function sendFriendRequestApi(receiverId: string, message?: string): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ message: string; id: string }>("/friends/request", {
    receiverId,
    ...(message !== undefined && message.length > 0 ? { message } : {}),
  });
  return { id: data.id };
}

export async function acceptFriendRequestApi(requestId: string): Promise<void> {
  await apiClient.post(`/friends/request/${requestId}/accept`);
}

export async function rejectFriendRequestApi(requestId: string): Promise<void> {
  await apiClient.post(`/friends/request/${requestId}/reject`);
}

export async function cancelFriendRequestApi(requestId: string): Promise<void> {
  await apiClient.post(`/friends/request/${requestId}/cancel`);
}

export async function unfriendUserApi(otherUserId: string): Promise<void> {
  await apiClient.delete(`/friends/${otherUserId}`);
}
