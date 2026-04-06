import type { Message } from "@/lib/types/chat";

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.isOwn) {
    return (
      <div className="flex justify-end px-1">
        <div className="max-w-[min(70%,28rem)] rounded-lg rounded-br-sm bg-[var(--zalo-blue)] px-2.5 py-1.5">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-white">
            {message.body}
          </p>
          <p className="mt-0.5 text-right text-[10px] leading-none text-white/75">{message.sentAt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start px-1">
      <div className="max-w-[min(70%,28rem)] rounded-lg rounded-bl-sm bg-white px-2.5 py-1.5 ring-1 ring-black/[0.06]">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-[var(--zalo-text)]">
          {message.body}
        </p>
        <p className="mt-0.5 text-[10px] leading-none text-[var(--zalo-text-muted)]">{message.sentAt}</p>
      </div>
    </div>
  );
}
