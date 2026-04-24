/** Local calendar day key YYYY-MM-DD */
export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Label for the sticky date separator between message groups (Vietnamese). */
export function formatMessageDateSeparator(iso: string): string {
  const msg = new Date(iso);
  if (Number.isNaN(msg.getTime())) return "";

  const now = new Date();
  const msgDay = localDayKey(msg);
  const today = localDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (msgDay === today) return "Hôm nay";
  if (msgDay === localDayKey(yesterday)) return "Hôm qua";

  return msg.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
