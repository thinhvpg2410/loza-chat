import type { MockConversation } from "@/constants/mockData";

/**
 * Client-side filter (mock). Replace with server search when backend exists.
 */
export function filterConversations(items: MockConversation[], query: string): MockConversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q),
  );
}

/**
 * Pinned first, then preserve relative order within each group.
 */
export function sortConversationsForDisplay(items: MockConversation[]): MockConversation[] {
  return [...items].sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned));
}
