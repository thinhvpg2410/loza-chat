import type { ChatRoomMessage, MessageFeedItem, MessageSenderRole } from "./types";
import { formatSeparatorLabel } from "./formatSeparatorLabel";

/** Show a time label when gap exceeds this (ms). */
const SEPARATOR_GAP_MS = 5 * 60 * 1000;

function needsSeparator(prevTime: Date, nextTime: Date): boolean {
  if (!isSameCalendarDay(prevTime, nextTime)) return true;
  return nextTime.getTime() - prevTime.getTime() > SEPARATOR_GAP_MS;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Sorts by time ascending, inserts separators, groups consecutive same-sender messages.
 */
export function buildMessageFeed(messages: ChatRoomMessage[]): MessageFeedItem[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const out: MessageFeedItem[] = [];
  let buffer: ChatRoomMessage[] = [];
  let bufferRole: MessageSenderRole | null = null;
  let lastEmittedTime: Date | null = null;

  const flushGroup = () => {
    if (buffer.length === 0 || bufferRole === null) return;
    out.push({
      kind: "group",
      key: `g-${buffer[0].id}-${buffer[buffer.length - 1].id}`,
      messages: [...buffer],
      role: bufferRole,
    });
    buffer = [];
    bufferRole = null;
  };

  for (const msg of sorted) {
    const t = new Date(msg.createdAt);

    if (lastEmittedTime === null || needsSeparator(lastEmittedTime, t)) {
      flushGroup();
      out.push({
        kind: "separator",
        key: `sep-${msg.id}`,
        label: formatSeparatorLabel(lastEmittedTime, t),
      });
    } else if (bufferRole !== null && bufferRole !== msg.senderRole) {
      flushGroup();
    }

    buffer.push(msg);
    bufferRole = msg.senderRole;
    lastEmittedTime = t;
  }

  flushGroup();
  return out;
}
