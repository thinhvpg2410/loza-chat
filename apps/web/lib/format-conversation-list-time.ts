import { localDayKey } from "@/lib/format-message-date";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Last-activity label for the conversation list (relative to local `now`):
 * - Same calendar day: `HH:mm`
 * - Same year, different day: `dd/mm`
 * - Different year: `dd/mm/yy`
 * Returns `value` unchanged when it is not a parseable date (e.g. mock labels).
 */
export function formatConversationListActivityTime(value: string, now = new Date()): string {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return value;
  const d = new Date(ms);
  if (localDayKey(d) === localDayKey(now)) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  if (d.getFullYear() === now.getFullYear()) {
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  }
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${pad2(d.getFullYear() % 100)}`;
}
