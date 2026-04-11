import type { MockFriend } from "@/constants/mockData";
import { MOCK_FRIENDS, MOCK_SEARCH_USERS } from "@/constants/mockData";

import type { SearchUserOutcome } from "./types";
import { getFriendRelation } from "./socialGraph";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

const F1_PHONE_DIGITS = "84901234567";

function matchesF1Phone(d: string): boolean {
  return (
    d === F1_PHONE_DIGITS ||
    d === "0901234567" ||
    d === "901234567" ||
    (d.length >= 9 && d.endsWith("901234567"))
  );
}

/**
 * Deterministic mock search — replace with API.
 * Tips for QA: `vantai` → found; `84901234567` / `0901234567` → already friend; `pendingdemo` → pending; `notfound` → not found
 */
export function searchUserMock(rawQuery: string, extraPendingUserIds: Set<string>): SearchUserOutcome {
  const q = rawQuery.trim();
  if (q.length < 2) return { state: "idle" };

  const lower = q.toLowerCase();
  const d = digitsOnly(q);

  if (lower.includes("notfound")) {
    return { state: "not_found" };
  }

  if (lower.includes("pendingdemo")) {
    const u = MOCK_SEARCH_USERS.find((x) => x.id === "u-search-2") ?? MOCK_SEARCH_USERS[0];
    return { state: "pending", user: u };
  }

  if (matchesF1Phone(d) || lower.includes("minh.anh") || (lower.includes("minh") && lower.includes("anh"))) {
    const u = MOCK_FRIENDS.find((f) => f.id === "f1");
    if (u) return { state: "already_friend", user: u };
  }

  if (lower.includes("vantai") || d === "84990000001" || d === "0909000001") {
    const u = MOCK_SEARCH_USERS.find((x) => x.id === "u-search-1");
    if (u) {
      const rel = getFriendRelation(u.id);
      if (rel === "friend") return { state: "already_friend", user: u };
      if (rel === "pending_out" || extraPendingUserIds.has(u.id)) return { state: "pending", user: u };
      return { state: "found", user: u };
    }
  }

  if (lower.includes("lehang") || d === "84990000002") {
    const u = MOCK_SEARCH_USERS.find((x) => x.id === "u-search-2");
    if (u) {
      const rel = getFriendRelation(u.id);
      if (extraPendingUserIds.has(u.id)) return { state: "pending", user: u };
      if (rel === "friend") return { state: "already_friend", user: u };
      return { state: "found", user: u };
    }
  }

  const byUsername = (list: MockFriend[], needle: string) =>
    list.find((u) => (u.username ?? "").toLowerCase() === needle);

  const hit =
    byUsername(MOCK_FRIENDS, lower) ||
    byUsername(MOCK_SEARCH_USERS, lower) ||
    MOCK_FRIENDS.find((f) => f.name.toLowerCase().includes(lower)) ||
    MOCK_SEARCH_USERS.find((f) => f.name.toLowerCase().includes(lower));

  if (!hit) return { state: "not_found" };

  const rel = getFriendRelation(hit.id);
  if (rel === "friend") return { state: "already_friend", user: hit };
  if (rel === "pending_out" || extraPendingUserIds.has(hit.id)) return { state: "pending", user: hit };

  return { state: "found", user: hit };
}
