import type { MessageReaction } from "@/lib/types/chat";

export function toggleViewerReaction(
  reactions: MessageReaction[] | undefined,
  emoji: string,
): MessageReaction[] {
  const list = [...(reactions ?? [])];
  const idx = list.findIndex((r) => r.emoji === emoji);
  if (idx === -1) {
    return [...list, { emoji, count: 1, viewerReacted: true }];
  }
  const cur = { ...list[idx] };
  if (cur.viewerReacted) {
    cur.count = Math.max(0, cur.count - 1);
    cur.viewerReacted = false;
    if (cur.count === 0) {
      list.splice(idx, 1);
      return list;
    }
    list[idx] = cur;
    return list;
  }
  cur.count += 1;
  cur.viewerReacted = true;
  list[idx] = cur;
  return list;
}
