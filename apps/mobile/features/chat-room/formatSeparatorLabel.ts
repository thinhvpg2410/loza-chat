/**
 * Labels for timestamp separators between message clusters (Zalo-like).
 */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a) === startOfDay(b);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDayTitle(d: Date): string {
  const now = new Date();
  const today = startOfDay(now);
  const y = startOfDay(d);
  const dayMs = 86400000;
  if (y === today) return "Hôm nay";
  if (y === today - dayMs) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" });
}

/**
 * @param prev - previous message time (null for first message cluster)
 * @param current - time of the message after the separator
 */
export function formatSeparatorLabel(prev: Date | null, current: Date): string {
  if (prev === null) {
    return `${formatDayTitle(current)} · ${formatTime(current)}`;
  }
  if (!isSameDay(prev, current)) {
    return `${formatDayTitle(current)} · ${formatTime(current)}`;
  }
  return formatTime(current);
}
