import { apiFetchJson } from "@/lib/api/server";
import type { WebProfileUser } from "@/lib/types/profile";
import type { ApiFriendListEntry, ApiIncomingRequest, ApiOutgoingRequest } from "@/lib/friends/api-dtos";
import { getSocialApiContext } from "@/lib/friends/social-api-context";
import type { Friend, FriendRequest, ProfileUser } from "@/lib/types/social";
import { mapApiFriend, mapIncomingRequest, mapOutgoingRequest } from "@/lib/friends/map-api-social";

function mapMeToProfileUser(user: WebProfileUser): ProfileUser {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username ?? "",
    phone: user.phoneNumber ?? undefined,
    bio: user.statusMessage ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    isSelf: true,
    relationshipStatus: "self",
  };
}

export type FriendsPageInitial =
  | { source: "mock" }
  | {
      source: "api";
      friends: Friend[];
      error: string | null;
      selfProfile: ProfileUser;
    };

export async function loadFriendsPageInitial(): Promise<FriendsPageInitial> {
  const ctx = await getSocialApiContext();
  if (!ctx.ok) return { source: "mock" };

  let selfProfile: ProfileUser;
  try {
    const { user } = await apiFetchJson<{ user: WebProfileUser }>("/users/me");
    selfProfile = mapMeToProfileUser(user);
  } catch {
    return {
      source: "api",
      friends: [],
      error: "Không tải được tài khoản.",
      selfProfile: {
        id: "me",
        displayName: "Tài khoản",
        username: "",
        isSelf: true,
        relationshipStatus: "self",
      },
    };
  }

  try {
    const { friends: raw } = await apiFetchJson<{ friends: ApiFriendListEntry[] }>("/friends");
    return {
      source: "api",
      friends: raw.map(mapApiFriend),
      error: null,
      selfProfile,
    };
  } catch (e) {
    return {
      source: "api",
      friends: [],
      error: e instanceof Error ? e.message : "Không tải được danh sách bạn bè.",
      selfProfile,
    };
  }
}

export type FriendRequestsPageInitial =
  | { source: "mock" }
  | {
      source: "api";
      incoming: FriendRequest[];
      outgoing: FriendRequest[];
      error: string | null;
    };

export async function loadFriendRequestsPageInitial(): Promise<FriendRequestsPageInitial> {
  const ctx = await getSocialApiContext();
  if (!ctx.ok) return { source: "mock" };

  try {
    const [inc, out] = await Promise.all([
      apiFetchJson<{ requests: ApiIncomingRequest[] }>("/friends/requests/incoming"),
      apiFetchJson<{ requests: ApiOutgoingRequest[] }>("/friends/requests/outgoing"),
    ]);
    return {
      source: "api",
      incoming: inc.requests.map(mapIncomingRequest),
      outgoing: out.requests.map(mapOutgoingRequest),
      error: null,
    };
  } catch (e) {
    return {
      source: "api",
      incoming: [],
      outgoing: [],
      error: e instanceof Error ? e.message : "Không tải được lời mời.",
    };
  }
}
