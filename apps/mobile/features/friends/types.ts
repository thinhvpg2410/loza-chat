import type { MockFriend } from "@/constants/mockData";

export type FriendRelation = "friend" | "pending_out" | "pending_in" | "none";

export type SearchUserState = "idle" | "loading" | "not_found" | "found" | "already_friend" | "pending";

export type SearchUserOutcome =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "not_found" }
  | { state: "found"; user: MockFriend }
  | { state: "already_friend"; user: MockFriend }
  | { state: "pending"; user: MockFriend };

export type FriendsSection = {
  title: string;
  data: MockFriend[];
};
