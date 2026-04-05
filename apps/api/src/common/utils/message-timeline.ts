/** Total order for messages: chronological by `createdAt`, tie-break by `id` (matches cursor pagination). */

export type MessageTimelineRef = {
  createdAt: Date;
  id: string;
};

export function compareMessageTimeline(
  a: MessageTimelineRef,
  b: MessageTimelineRef,
): number {
  const dt = a.createdAt.getTime() - b.createdAt.getTime();
  if (dt !== 0) {
    return dt;
  }
  return a.id.localeCompare(b.id);
}

/** True if `a` is strictly after `b` in conversation timeline (newer). */
export function isMessageAfter(a: MessageTimelineRef, b: MessageTimelineRef): boolean {
  return compareMessageTimeline(a, b) > 0;
}

/** True if `ref` is the same message or later in the timeline than `msg`. */
export function isRefAtOrAfterMessage(
  ref: MessageTimelineRef | null | undefined,
  msg: MessageTimelineRef,
): boolean {
  if (!ref) {
    return false;
  }
  return compareMessageTimeline(ref, msg) >= 0;
}

/** Returns the later of the two messages in timeline order, or `null` if both absent. */
export function maxMessageTimelineRef(
  a: MessageTimelineRef | null | undefined,
  b: MessageTimelineRef | null | undefined,
): MessageTimelineRef | null {
  if (!a) {
    return b ?? null;
  }
  if (!b) {
    return a;
  }
  return isMessageAfter(a, b) ? a : b;
}
