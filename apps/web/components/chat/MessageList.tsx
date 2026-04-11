import type { ReactNode } from "react";
import type { Message, MessageReaction } from "@/lib/types/chat";
import { formatMessageDateSeparator } from "@/lib/format-message-date";
import { getGroupPosition } from "@/lib/message-grouping";
import { MessageBubble } from "@/components/chat/MessageBubble";

type MessageListProps = {
  messages: Message[];
  getReactions: (messageId: string) => MessageReaction[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onOpenImage: (url: string) => void;
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

export function MessageList({
  messages,
  getReactions,
  onToggleReaction,
  onReply,
  onOpenImage,
}: MessageListProps) {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const items: ReactNode[] = [];
  let lastDayKey = "";

  sorted.forEach((m, index) => {
    const dayKey = m.createdAt.slice(0, 10);
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      items.push(
        <DateSeparator key={`sep-${m.id}-${dayKey}`} label={formatMessageDateSeparator(m.createdAt)} />,
      );
    }

    const groupPosition = getGroupPosition(sorted, index);
    items.push(
      <MessageBubble
        key={m.id}
        message={m}
        groupPosition={groupPosition}
        reactions={getReactions(m.id)}
        onToggleReaction={(emoji) => onToggleReaction(m.id, emoji)}
        onReply={() => onReply(m)}
        onOpenImage={onOpenImage}
      />,
    );
  });

  return <div className="flex flex-col px-2 pb-2 pt-1">{items}</div>;
}
