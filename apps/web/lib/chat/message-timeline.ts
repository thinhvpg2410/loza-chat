/** Timeline order matches API pagination: chronological by `createdAt`, tie-break by `id`. */

export type MessageTimelineRef = {
  id: string;
  createdAt: string;
};

export function compareMessageTimelineIso(a: MessageTimelineRef, b: MessageTimelineRef): number {
  const dt = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (dt !== 0) return dt;
  return a.id.localeCompare(b.id);
}

/** True if `ref` is the same message or later than `msg` in the thread. */
export function isRefAtOrAfterMessageIso(
  ref: MessageTimelineRef | null | undefined,
  msg: MessageTimelineRef,
): boolean {
  if (!ref) return false;
  return compareMessageTimelineIso(ref, msg) >= 0;
}

export function maxMessageTimelineRefIso(
  a: MessageTimelineRef | null | undefined,
  b: MessageTimelineRef | null | undefined,
): MessageTimelineRef | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return compareMessageTimelineIso(a, b) >= 0 ? a : b;
}
