"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  fetchConversationMessagesAction,
  fetchConversationsListAction,
  markConversationReadAction,
  sendChatStickerMessageAction,
  sendChatTextMessageAction,
} from "@/features/chat/chat-actions";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ImagePreviewModal } from "@/components/chat/ImagePreviewModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { messageSnippet } from "@/lib/message-snippet";
import { toggleViewerReaction } from "@/lib/reaction-utils";
import type { Conversation, Message, MessageReaction, ReplyPreviewRef } from "@/lib/types/chat";

type ApiChatPanelProps = {
  conversation: Conversation | null;
  onConversationsRefresh?: (conversations: Conversation[]) => void;
};

function buildClientMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ApiChatPanel({ conversation, onConversationsRefresh }: ApiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadOlderLoading, setLoadOlderLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, MessageReaction[]>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ convId: string; message: Message } | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const messageScrollRef = useRef<HTMLDivElement>(null);
  const scrollAfterOwnSendRef = useRef(false);

  useEffect(() => {
    if (!conversation) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setLoadError(null);
      setMessages([]);
      setNextCursor(null);

      void fetchConversationMessagesAction(conversation.id).then((r) => {
        if (cancelled) return;
        setLoading(false);
        if (!r.ok) {
          setLoadError(r.error);
          return;
        }
        setMessages(r.messages);
        setNextCursor(r.nextCursor);
        const last = r.messages[r.messages.length - 1];
        if (last) void markConversationReadAction(conversation.id, last.id);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [conversation]);

  const loadOlder = useCallback(async () => {
    if (!conversation || !nextCursor || loadOlderLoading) return;
    setLoadOlderLoading(true);
    const r = await fetchConversationMessagesAction(conversation.id, nextCursor);
    setLoadOlderLoading(false);
    if (!r.ok) return;
    setMessages((prev) => [...r.messages, ...prev]);
    setNextCursor(r.nextCursor);
  }, [conversation, nextCursor, loadOlderLoading]);

  const refreshSidebar = useCallback(async () => {
    if (!onConversationsRefresh) return;
    const r = await fetchConversationsListAction();
    if (r.ok) onConversationsRefresh(r.conversations);
  }, [onConversationsRefresh]);

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

  const sendText = useCallback(async () => {
    if (!conversation) return;
    const body = draft.trim();
    if (!body || sending) return;

    setSendError(null);
    setSending(true);
    const replyToId =
      replyTarget && replyTarget.convId === conversation.id
        ? replyTarget.message.id
        : undefined;

    const r = await sendChatTextMessageAction({
      conversationId: conversation.id,
      content: body,
      clientMessageId: buildClientMessageId(),
      replyToMessageId: replyToId,
    });

    setSending(false);
    if (!r.ok) {
      setSendError(r.error);
      return;
    }

    scrollAfterOwnSendRef.current = true;
    setDraft("");
    setReplyTarget(null);
    setMessages((prev) => {
      if (prev.some((m) => m.id === r.message.id)) return prev;
      return [...prev, r.message];
    });
    void markConversationReadAction(conversation.id, r.message.id);
    void refreshSidebar();
  }, [conversation, draft, replyTarget, sending, refreshSidebar]);

  const sendSticker = useCallback(
    async (stickerId: string, _emoji: string) => {
      void _emoji;
      if (!conversation || sending) return;
      setSendError(null);
      setSending(true);
      const replyToId =
        replyTarget && replyTarget.convId === conversation.id
          ? replyTarget.message.id
          : undefined;

      const r = await sendChatStickerMessageAction({
        conversationId: conversation.id,
        stickerId,
        clientMessageId: buildClientMessageId(),
        replyToMessageId: replyToId,
      });

      setSending(false);
      if (!r.ok) {
        setSendError(r.error);
        return;
      }

      scrollAfterOwnSendRef.current = true;
      setReplyTarget(null);
      setMessages((prev) => {
        if (prev.some((m) => m.id === r.message.id)) return prev;
        return [...prev, r.message];
      });
      void markConversationReadAction(conversation.id, r.message.id);
      void refreshSidebar();
    },
    [conversation, replyTarget, sending, refreshSidebar],
  );

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
            {loadError ? (
              <div className="px-4 py-3" role="alert">
                <p className="text-center text-[13px] text-red-600/90">{loadError}</p>
              </div>
            ) : null}
            {loading ? (
              <div className="flex justify-center py-10">
                <p className="text-[13px] text-[var(--zalo-text-muted)]">Đang tải tin nhắn…</p>
              </div>
            ) : (
              <>
                {nextCursor ? (
                  <div className="flex justify-center py-2">
                    <button
                      type="button"
                      onClick={() => void loadOlder()}
                      disabled={loadOlderLoading}
                      className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06] disabled:opacity-50"
                    >
                      {loadOlderLoading ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                    </button>
                  </div>
                ) : null}
                <MessageList
                  messages={messages}
                  getReactions={getReactions}
                  onToggleReaction={onToggleReaction}
                  onReply={(m) => {
                    if (conversation) setReplyTarget({ convId: conversation.id, message: m });
                  }}
                  onOpenImage={setPreviewUrl}
                />
              </>
            )}
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
        <>
          {sendError ? (
            <div className="border-t border-red-200 bg-red-50 px-3 py-1.5" role="alert">
              <p className="text-center text-[12px] text-red-700">{sendError}</p>
            </div>
          ) : null}
          <MessageInput
            value={draft}
            onChange={setDraft}
            onSend={() => void sendText()}
            disabled={loading || sending}
            replyTo={replyRef}
            onCancelReply={() => setReplyTarget(null)}
            attachmentsEnabled={false}
            stickersEnabled
            onPickSticker={(stickerId, emoji) => void sendSticker(stickerId, emoji)}
            onInsertEmoji={(emoji) => setDraft((d) => d + emoji)}
          />
        </>
      ) : (
        <MessageInput value="" onChange={() => {}} onSend={() => {}} disabled />
      )}
      <ImagePreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </section>
  );
}
