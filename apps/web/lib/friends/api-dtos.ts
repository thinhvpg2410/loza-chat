/** Friends / users API JSON shapes (subset). */

import type { RelationshipStatus } from "@/lib/types/social";

export type { RelationshipStatus };

export type ApiPublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
  statusMessage: string | null;
};

export type ApiFriendListEntry = ApiPublicProfile & {
  friendshipId: string;
  friendsSince: string;
};

export type ApiIncomingRequest = {
  id: string;
  message: string | null;
  createdAt: string;
  sender: ApiPublicProfile;
};

export type ApiOutgoingRequest = {
  id: string;
  message: string | null;
  createdAt: string;
  receiver: ApiPublicProfile;
};

export type ApiSearchResult = ApiPublicProfile & {
  relationshipStatus: RelationshipStatus;
};
