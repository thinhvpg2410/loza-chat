import type { Message } from "@/lib/types/chat";
import { MessageBubble } from "@/components/chat/MessageBubble";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}
