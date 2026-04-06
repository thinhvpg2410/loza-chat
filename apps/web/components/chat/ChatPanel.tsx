"use client";

import { useCallback, useMemo, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import type { AttachmentAction } from "@/components/chat/AttachmentPanel";
import { ImagePreviewModal } from "@/components/chat/ImagePreviewModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { TypingIndicatorSession } from "@/components/chat/TypingIndicator";
import { getMessagesForConversation } from "@/lib/mock-chat";
import { messageSnippet } from "@/lib/message-snippet";
import { toggleViewerReaction } from "@/lib/reaction-utils";
import type {
  Conversation,
  FileMessage,
  ImageMessage,
  Message,
  MessageReaction,
  ReplyPreviewRef,
  StickerMessage,
  TextMessage,
} from "@/lib/types/chat";

type ChatPanelProps = {
  conversation: Conversation | null;
};

const MOCK_ATTACH_IMAGE =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&q=80&auto=format&fit=crop";

function buildMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ComposerProps = {
  conversation: Conversation;
  onSend: (message: Message) => void;
  replyTo: ReplyPreviewRef | null;
  onCancelReply: () => void;
};

function ChatComposer({ conversation, onSend, replyTo, onCancelReply }: ComposerProps) {
  const [draft, setDraft] = useState("");

  const sendText = () => {
    const body = draft.trim();
    if (!body) return;

    const now = new Date();
    const sentAt = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const msg: TextMessage = {
      kind: "text",
      id: buildMessageId(),
      conversationId: conversation.id,
      body,
      sentAt,
      createdAt: now.toISOString(),
      isOwn: true,
      replyTo: replyTo ?? undefined,
    };

    onSend(msg);
    setDraft("");
    onCancelReply();
  };

  const handleAttachment = (action: AttachmentAction) => {
    const now = new Date();
    const sentAt = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const base = {
      id: buildMessageId(),
      conversationId: conversation.id,
      sentAt,
      createdAt: now.toISOString(),
      isOwn: true as const,
    };

    if (action === "image") {
      const img: ImageMessage = {
        ...base,
        kind: "image",
        imageUrl: MOCK_ATTACH_IMAGE,
        alt: "Ảnh đính kèm",
        loading: false,
      };
      onSend(img);
      return;
    }

    if (action === "file") {
      const file: FileMessage = {
        ...base,
        kind: "file",
        fileName: "tai-lieu-mock.pdf",
        fileSizeBytes: 524288,
        mimeType: "application/pdf",
      };
      onSend(file);
    }
  };

  const handleSticker = (stickerId: string, emoji: string) => {
    const now = new Date();
    const sentAt = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const s: StickerMessage = {
      kind: "sticker",
      id: buildMessageId(),
      conversationId: conversation.id,
      stickerId,
      emoji,
      sentAt,
      createdAt: now.toISOString(),
      isOwn: true,
    };
    onSend(s);
  };

  return (
    <MessageInput
      value={draft}
      onChange={setDraft}
      onSend={sendText}
      disabled={false}
      replyTo={replyTo}
      onCancelReply={onCancelReply}
      onAttachment={handleAttachment}
      onPickSticker={handleSticker}
    />
  );
}

export function ChatPanel({ conversation }: ChatPanelProps) {
  const [extraByConversation, setExtraByConversation] = useState<Record<string, Message[]>>({});
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, MessageReaction[]>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ convId: string; message: Message } | null>(
    null,
  );

  const messages = useMemo(() => {
    if (!conversation) return [];
    const base = getMessagesForConversation(conversation.id);
    const extra = extraByConversation[conversation.id] ?? [];
    return [...base, ...extra];
  }, [conversation, extraByConversation]);

  const onToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setReactionOverrides((prev) => {
        const msg = messages.find((m) => m.id === messageId);
        const current = prev[messageId] ?? msg?.reactions ?? [];
        return { ...prev, [messageId]: toggleViewerReaction(current, emoji) };
      });
    },
    [messages],
  );

  const getReactions = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      return reactionOverrides[messageId] ?? msg?.reactions ?? [];
    },
    [messages, reactionOverrides],
  );

  const appendMessage = (message: Message) => {
    setExtraByConversation((prev) => ({
      ...prev,
      [message.conversationId]: [...(prev[message.conversationId] ?? []), message],
    }));
  };

  const replyRef: ReplyPreviewRef | null =
    conversation && replyTarget && replyTarget.convId === conversation.id
      ? {
          messageId: replyTarget.message.id,
          snippet: messageSnippet(replyTarget.message),
          isOwn: replyTarget.message.isOwn,
        }
      : null;

  return (
    <section
      className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
      aria-label="Khung trò chuyện"
    >
      <ChatHeader conversation={conversation} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--zalo-chat-bg)]">
        {conversation ? (
          <>
            <MessageList
              messages={messages}
              getReactions={getReactions}
              onToggleReaction={onToggleReaction}
              onReply={(m) => {
                if (conversation) setReplyTarget({ convId: conversation.id, message: m });
              }}
              onOpenImage={setPreviewUrl}
            />
            <div className="px-2">
              <TypingIndicatorSession
                key={conversation.id}
                label="Minh Anh đang nhập"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center px-6">
            <p className="max-w-sm text-center text-[13px] text-[var(--zalo-text-muted)]">
              Chọn một cuộc trò chuyện từ danh sách để xem tin nhắn.
            </p>
          </div>
        )}
      </div>
      {conversation ? (
        <ChatComposer
          key={conversation.id}
          conversation={conversation}
          onSend={appendMessage}
          replyTo={replyRef}
          onCancelReply={() => setReplyTarget(null)}
        />
      ) : (
        <MessageInput value="" onChange={() => {}} onSend={() => {}} disabled />
      )}
      <ImagePreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </section>
  );
}
