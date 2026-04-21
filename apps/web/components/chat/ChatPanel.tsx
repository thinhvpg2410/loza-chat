"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ApiChatPanel } from "@/components/chat/ApiChatPanel";
import { ChatHeader } from "@/components/chat/ChatHeader";
import type { AttachmentAction } from "@/components/chat/AttachmentPanel";
import { DocumentPreviewModal } from "@/components/chat/DocumentPreviewModal";
import { ImagePreviewModal } from "@/components/chat/ImagePreviewModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
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

export type ChatPanelProps = {
  conversation: Conversation | null;
  chatSource?: "mock" | "api";
  onConversationsRefresh?: (conversations: Conversation[]) => void;
  onGroupConversationEnded?: (conversationId: string) => void;
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
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
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
      onInsertEmoji={(emoji) => setDraft((d) => d + emoji)}
    />
  );
}

function MockChatPanel({ conversation }: { conversation: Conversation | null }) {
  const [extraByConversation, setExtraByConversation] = useState<Record<string, Message[]>>({});
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, MessageReaction[]>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    embedUrl: string;
    title: string;
    downloadUrl: string;
  } | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ convId: string; message: Message } | null>(
    null,
  );
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const scrollAfterOwnSendRef = useRef(false);

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

  const appendMessage = useCallback((message: Message) => {
    scrollAfterOwnSendRef.current = true;
    setExtraByConversation((prev) => ({
      ...prev,
      [message.conversationId]: [...(prev[message.conversationId] ?? []), message],
    }));
  }, []);

  useLayoutEffect(() => {
    const el = messageScrollRef.current;
    if (!el || !scrollAfterOwnSendRef.current) return;
    scrollAfterOwnSendRef.current = false;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const replyRef: ReplyPreviewRef | null =
    conversation && replyTarget && replyTarget.convId === conversation.id
      ? {
          messageId: replyTarget.message.id,
          snippet: messageSnippet(replyTarget.message),
          isOwn: replyTarget.message.isOwn,
          peerSenderName: replyTarget.message.isOwn
            ? undefined
            : (replyTarget.message.senderDisplayName ?? "").trim() || undefined,
        }
      : null;

  return (
    <section
      className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
      aria-label="Khung trò chuyện"
    >
      <ChatHeader conversation={conversation} />
      <div
        ref={messageScrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[var(--zalo-chat-bg)]"
      >
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
              onOpenDocument={(embedUrl, title, downloadUrl) =>
                setDocumentPreview({ embedUrl, title, downloadUrl })
              }
            />
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
      <DocumentPreviewModal
        embedUrl={documentPreview?.embedUrl ?? null}
        title={documentPreview?.title ?? ""}
        downloadUrl={documentPreview?.downloadUrl ?? null}
        onClose={() => setDocumentPreview(null)}
      />
    </section>
  );
}

export function ChatPanel({
  conversation,
  chatSource = "mock",
  onConversationsRefresh,
  onGroupConversationEnded,
}: ChatPanelProps) {
  if (chatSource === "api") {
    return (
      <ApiChatPanel
        key={conversation?.id ?? "__none__"}
        conversation={conversation}
        onConversationsRefresh={onConversationsRefresh}
        onGroupConversationEnded={onGroupConversationEnded}
      />
    );
  }
  return <MockChatPanel conversation={conversation} />;
}
