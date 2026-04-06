import type { Message, MessageGroupPosition } from "@/lib/types/chat";

export function getGroupPosition(messages: Message[], index: number): MessageGroupPosition {
  const cur = messages[index];
  if (cur.kind === "system") return "single";

  const prev = messages[index - 1];
  const next = messages[index + 1];

  const canGroup = (a: Message, b: Message) =>
    a.kind !== "system" &&
    b.kind !== "system" &&
    a.isOwn === b.isOwn &&
    a.createdAt.slice(0, 10) === b.createdAt.slice(0, 10);

  const prevSame = prev && canGroup(prev, cur);
  const nextSame = next && canGroup(cur, next);

  if (!prevSame && !nextSame) return "single";
  if (!prevSame && nextSame) return "first";
  if (prevSame && nextSame) return "middle";
  return "last";
}

export function groupSpacingClass(position: MessageGroupPosition): string {
  switch (position) {
    case "first":
    case "single":
      return "mt-3";
    case "middle":
    case "last":
      return "mt-0.5";
    default:
      return "mt-3";
  }
}
