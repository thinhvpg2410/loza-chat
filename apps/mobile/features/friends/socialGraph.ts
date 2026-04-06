import type { MockFriend } from "@/constants/mockData";
import {
  MOCK_FRIENDS,
  MOCK_INCOMING_FRIEND_REQUESTS,
  MOCK_OUTGOING_FRIEND_REQUESTS,
  MOCK_SEARCH_USERS,
} from "@/constants/mockData";

import type { FriendRelation } from "./types";

function allKnownPeers(): MockFriend[] {
  return [
    ...MOCK_FRIENDS,
    ...MOCK_SEARCH_USERS,
    ...MOCK_INCOMING_FRIEND_REQUESTS.map((r) => r.peer),
    ...MOCK_OUTGOING_FRIEND_REQUESTS.map((r) => r.peer),
  ];
}

export function findUserById(userId: string): MockFriend | undefined {
  const map = new Map<string, MockFriend>();
  for (const u of allKnownPeers()) {
    if (!map.has(u.id)) map.set(u.id, u);
  }
  return map.get(userId);
}

export function getFriendRelation(userId: string): FriendRelation {
  if (MOCK_FRIENDS.some((f) => f.id === userId)) return "friend";
  if (MOCK_OUTGOING_FRIEND_REQUESTS.some((r) => r.peer.id === userId)) return "pending_out";
  if (MOCK_INCOMING_FRIEND_REQUESTS.some((r) => r.peer.id === userId)) return "pending_in";
  return "none";
}
