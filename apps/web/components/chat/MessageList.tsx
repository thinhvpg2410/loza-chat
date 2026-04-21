import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Message, MessageReaction } from "@/lib/types/chat";
import { formatMessageDateSeparator } from "@/lib/format-message-date";
import { getGroupPosition } from "@/lib/message-grouping";
import { MessageBubble } from "@/components/chat/MessageBubble";

type MessageListProps = {
  messages: Message[];
  getReactions: (messageId: string) => MessageReaction[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onRecall?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onOpenImage: (url: string) => void;
  onOpenDocument?: (embedUrl: string, title: string, downloadUrl: string) => void;
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
  onRecall,
  onDelete,
  onForward,
  onOpenImage,
  onOpenDocument,
}: MessageListProps) {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [visibleStart, setVisibleStart] = useState(() =>
    sorted.length > 300 ? sorted.length - 220 : 0,
  );
  useEffect(() => {
    setVisibleStart(sorted.length > 300 ? sorted.length - 220 : 0);
  }, [messages]);
  const visibleSorted = useMemo(
    () => sorted.slice(Math.max(0, Math.min(visibleStart, sorted.length))),
    [sorted, visibleStart],
  );

  const items: ReactNode[] = [];
  let lastDayKey = "";

  visibleSorted.forEach((m, index) => {
    const dayKey = m.createdAt.slice(0, 10);
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      items.push(
        <DateSeparator key={`sep-${m.id}-${dayKey}`} label={formatMessageDateSeparator(m.createdAt)} />,
      );
    }

    const groupPosition = getGroupPosition(visibleSorted, index);
    items.push(
      <MessageBubble
        key={m.id}
        message={m}
        groupPosition={groupPosition}
        reactions={getReactions(m.id)}
        onToggleReaction={(emoji) => onToggleReaction(m.id, emoji)}
        onReply={() => onReply(m)}
        onRecall={onRecall && m.isOwn && m.kind !== "system" ? () => onRecall(m) : undefined}
        onDelete={onDelete && m.isOwn && m.kind !== "system" ? () => onDelete(m) : undefined}
        onForward={onForward && m.kind !== "system" ? () => onForward(m) : undefined}
        onOpenImage={onOpenImage}
        onOpenDocument={onOpenDocument}
      />,
    );
  });

  return (
    <div className="flex flex-col px-2 pb-2 pt-1">
      {visibleStart > 0 ? (
        <div className="flex justify-center py-2">
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1 text-[11px] text-[var(--zalo-blue)] ring-1 ring-black/[0.06]"
            onClick={() => setVisibleStart((v) => Math.max(0, v - 200))}
          >
            Tải thêm tin cũ
          </button>
        </div>
      ) : null}
      {items}
    </div>
  );
}
