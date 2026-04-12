import { apiClient } from "@/services/api/client";

export type RelationshipStatus =
  | "self"
  | "none"
  | "outgoing_request"
  | "incoming_request"
  | "friend"
  | "blocked_by_me"
  | "blocked_me";

export type PublicUserProfileDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
  statusMessage: string | null;
};

export type UserSearchResultDto = PublicUserProfileDto & {
  relationshipStatus: RelationshipStatus;
};

export async function searchUsersApi(params: {
  phoneNumber?: string;
  email?: string;
  username?: string;
}): Promise<UserSearchResultDto[]> {
  const { data } = await apiClient.get<{ results: UserSearchResultDto[] }>("/users/search", {
    params,
  });
  return data.results ?? [];
}

export async function getUserPublicProfileApi(
  targetUserId: string,
): Promise<{ profile: PublicUserProfileDto; relationshipStatus: RelationshipStatus }> {
  const { data } = await apiClient.get<{
    profile: PublicUserProfileDto;
    relationshipStatus: RelationshipStatus;
  }>(`/users/${targetUserId}/public-profile`);
  return data;
}
