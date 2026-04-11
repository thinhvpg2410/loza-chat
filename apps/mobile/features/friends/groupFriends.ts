import type { MockFriend } from "@/constants/mockData";

import type { FriendsSection } from "./types";

function normalizeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function bucket(name: string): string {
  const t = name.trim();
  if (!t.length) return "#";
  const ch = t[0];
  if (/^[0-9]/.test(ch)) return "#";
  const L = ch.toLocaleUpperCase("vi-VN");
  if (L === "Ă" || L === "Â") return "A";
  return L;
}

function filterFriends(friends: MockFriend[], query: string): MockFriend[] {
  const q = query.trim().toLowerCase();
  if (!q.length) return friends;
  return friends.filter((f) => {
    const name = normalizeKey(f.name);
    const un = (f.username ?? "").toLowerCase();
    const phone = (f.phone ?? "").replace(/\s/g, "");
    return name.includes(q) || un.includes(q) || phone.includes(q.replace(/\s/g, ""));
  });
}

function sectionOrderKey(title: string): string {
  if (title === "#") return "zzz#";
  if (title === "Đ") return "d-d";
  return title.toLowerCase();
}

/**
 * Alphabetical sections (basic). Ă/Â → A; digits → #.
 */
export function buildFriendSections(friends: MockFriend[], query: string): FriendsSection[] {
  const filtered = filterFriends(friends, query);
  const sorted = [...filtered].sort((a, b) =>
    normalizeKey(a.name).localeCompare(normalizeKey(b.name), "vi"),
  );

  const map = new Map<string, MockFriend[]>();
  for (const f of sorted) {
    const key = bucket(f.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }

  return [...map.entries()]
    .sort(([a], [b]) => sectionOrderKey(a).localeCompare(sectionOrderKey(b), "vi"))
    .map(([title, data]) => ({ title, data }));
}
