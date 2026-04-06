import type { ReactNode } from "react";
import type { Message } from "@/lib/types/chat";
import { formatMessageDateSeparator } from "@/lib/format-message-date";
import { MessageBubble } from "@/components/chat/MessageBubble";

type MessageListProps = {
  messages: Message[];
};

function DateSeparator({ label }: { label: string }) {
  if (!label) return null;
  return (
    <div className="flex justify-center py-3">
      <span className="rounded-full bg-black/[0.06] px-3 py-0.5 text-[11px] font-medium text-[var(--zalo-text-muted)]">
        {label}
      </span>
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const items: ReactNode[] = [];
  let lastDayKey = "";

  for (const m of sorted) {
    const dayKey = m.createdAt.slice(0, 10);
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      items.push(
        <DateSeparator key={`sep-${m.id}-${dayKey}`} label={formatMessageDateSeparator(m.createdAt)} />,
      );
    }
    items.push(<MessageBubble key={m.id} message={m} />);
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 pb-4 pt-2">{items}</div>
  );
}
