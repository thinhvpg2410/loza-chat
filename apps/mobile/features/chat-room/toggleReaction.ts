import type { MessageReaction } from "./types";

/** Toggle current user's reaction for an emoji (mock / optimistic UI). */
export function toggleReactionOnMessage(reactions: MessageReaction[] | undefined, emoji: string): MessageReaction[] {
  const list = [...(reactions ?? [])];
  const i = list.findIndex((r) => r.emoji === emoji);
  if (i === -1) {
    list.push({ emoji, count: 1, reactedByMe: true });
    return list;
  }
  const r = list[i];
  if (r.reactedByMe) {
    if (r.count <= 1) list.splice(i, 1);
    else list[i] = { ...r, count: r.count - 1, reactedByMe: false };
  } else {
    list[i] = { ...r, count: r.count + 1, reactedByMe: true };
  }
  return list;
}
