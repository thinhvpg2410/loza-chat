import type { MessageReaction } from "@/lib/types/chat";

/** Realtime payload: counts are global; preserve each viewer's highlight from prior UI state. */
export function mergeReactionBroadcastCounts(
  prev: MessageReaction[] | undefined,
  summary: { counts: { reaction: string; count: number }[]; mine?: string[] },
): MessageReaction[] {
  if (summary.mine && summary.mine.length > 0) {
    const mine = new Set(summary.mine);
    return (summary.counts ?? []).map(({ reaction, count }) => ({
      emoji: reaction,
      count,
      viewerReacted: mine.has(reaction),
    }));
  }
  const prevViewer = new Map((prev ?? []).map((r) => [r.emoji, r.viewerReacted === true]));
  return (summary.counts ?? []).map(({ reaction, count }) => ({
    emoji: reaction,
    count,
    viewerReacted: prevViewer.get(reaction) ?? false,
  }));
}

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
