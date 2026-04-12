import type {
  ApiFriendListEntry,
  ApiIncomingRequest,
  ApiOutgoingRequest,
  ApiPublicProfile,
} from "@/lib/friends/api-dtos";
import type { Friend, FriendRequest, ProfileUser, RelationshipStatus } from "@/lib/types/social";

export function mapApiFriend(entry: ApiFriendListEntry): Friend {
  return {
    id: entry.id,
    displayName: entry.displayName,
    username: entry.username ?? "",
    avatarUrl: entry.avatarUrl ?? undefined,
    status: entry.statusMessage ?? undefined,
    friendshipId: entry.friendshipId,
    friendsSince: entry.friendsSince,
  };
}

export function mapIncomingRequest(r: ApiIncomingRequest): FriendRequest {
  return {
    id: r.id,
    displayName: r.sender.displayName,
    username: r.sender.username ?? "",
    avatarUrl: r.sender.avatarUrl ?? undefined,
    message: r.message ?? undefined,
    direction: "incoming",
    status: "pending",
    counterpartId: r.sender.id,
  };
}

export function mapOutgoingRequest(r: ApiOutgoingRequest): FriendRequest {
  return {
    id: r.id,
    displayName: r.receiver.displayName,
    username: r.receiver.username ?? "",
    avatarUrl: r.receiver.avatarUrl ?? undefined,
    message: r.message ?? undefined,
    direction: "outgoing",
    status: "pending",
    counterpartId: r.receiver.id,
  };
}

export function mapPublicProfileToDrawerUser(
  profile: ApiPublicProfile,
  relationshipStatus: RelationshipStatus,
): ProfileUser {
  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username ?? "",
    bio: profile.statusMessage ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    relationshipStatus,
  };
}
