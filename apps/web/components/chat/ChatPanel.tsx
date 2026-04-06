"use client";

import { useMemo, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { getMessagesForConversation } from "@/lib/mock-chat";
import type { Conversation, Message } from "@/lib/types/chat";

type ChatPanelProps = {
  conversation: Conversation | null;
};

function buildMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ActiveComposerProps = {
  conversation: Conversation;
  onSent: (message: Message) => void;
};

function ActiveComposer({ conversation, onSent }: ActiveComposerProps) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;

    const now = new Date();
    const sentAt = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    const newMessage: Message = {
      id: buildMessageId(),
      conversationId: conversation.id,
      body,
      sentAt,
      isOwn: true,
    };

    onSent(newMessage);
    setDraft("");
  };

  return <Composer value={draft} onChange={setDraft} onSend={handleSend} disabled={false} />;
}

export function ChatPanel({ conversation }: ChatPanelProps) {
  const [extraByConversation, setExtraByConversation] = useState<Record<string, Message[]>>({});

  const messages = useMemo(() => {
    if (!conversation) return [];
    const base = getMessagesForConversation(conversation.id);
    const extra = extraByConversation[conversation.id] ?? [];
    return [...base, ...extra];
  }, [conversation, extraByConversation]);

  const appendMessage = (message: Message) => {
    setExtraByConversation((prev) => ({
      ...prev,
      [message.conversationId]: [...(prev[message.conversationId] ?? []), message],
    }));
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]" aria-label="Khung trò chuyện">
      <ChatHeader conversation={conversation} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversation ? (
          <MessageList messages={messages} />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center px-6">
            <p className="max-w-sm text-center text-sm text-[var(--zalo-text-muted)]">
              Chọn một cuộc trò chuyện từ danh sách bên trái để xem tin nhắn.
            </p>
          </div>
        )}
      </div>
      {conversation ? (
        <ActiveComposer key={conversation.id} conversation={conversation} onSent={appendMessage} />
      ) : (
        <Composer value="" onChange={() => {}} onSend={() => {}} disabled />
      )}
    </section>
  );
}
