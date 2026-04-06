import type { Message } from "@/lib/types/chat";

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.isOwn) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,520px)] rounded-2xl rounded-br-md bg-[var(--zalo-blue)] px-3 py-2 shadow-sm">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-white">
            {message.body}
          </p>
          <p className="mt-1 text-right text-[11px] text-white/80">{message.sentAt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,520px)] rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm ring-1 ring-black/[0.06]">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-[var(--zalo-text)]">
          {message.body}
        </p>
        <p className="mt-1 text-[11px] text-[var(--zalo-text-muted)]">{message.sentAt}</p>
      </div>
    </div>
  );
}
