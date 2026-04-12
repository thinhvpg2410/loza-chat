"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatRealtimeProvider } from "@/components/chat/chat-realtime-context";
import { ConversationList } from "@/components/chat/ConversationList";
import type { ApiMessageWithReceipt } from "@/lib/chat/api-dtos";
import { listPreviewFromApiMessage } from "@/lib/chat/list-preview-from-api";
import { getConversationById, mockConversations } from "@/lib/mock-chat";
import type { Conversation } from "@/lib/types/chat";

export type ChatWorkspaceProps = {
  chatSource?: "mock" | "api";
  initialApiConversations?: Conversation[];
  listError?: string | null;
};

export function ChatWorkspace({
  chatSource = "mock",
  initialApiConversations = [],
  listError = null,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    chatSource === "api" ? initialApiConversations : mockConversations,
  );

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const list = chatSource === "api" ? initialApiConversations : mockConversations;
    return list[0]?.id ?? null;
  });

  const openConversationId = searchParams.get("open");

  useEffect(() => {
    if (chatSource !== "api" || !openConversationId) return;
    queueMicrotask(() => {
      setSelectedId(openConversationId);
      router.replace("/", { scroll: false });
    });
  }, [chatSource, openConversationId, router]);

  useEffect(() => {
    if (chatSource !== "api") return;
    queueMicrotask(() => {
      setConversations(initialApiConversations);
    });
  }, [chatSource, initialApiConversations]);

  useEffect(() => {
    if (!selectedId) return;
    if (chatSource === "api") return;
    if (!conversations.some((c) => c.id === selectedId)) {
      queueMicrotask(() => {
        setSelectedId(conversations[0]?.id ?? null);
      });
    }
  }, [chatSource, conversations, selectedId]);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (chatSource !== "api" || !selectedId) return;
    queueMicrotask(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
      );
    });
  }, [chatSource, selectedId]);

  const activeConversation = useMemo(() => {
    if (!selectedId) return null;
    if (chatSource === "api") {
      const found = conversations.find((c) => c.id === selectedId);
      if (found) return found;
      return {
        id: selectedId,
        title: "Trò chuyện",
        lastMessagePreview: "",
        lastMessageAt: new Date().toISOString(),
      };
    }
    return getConversationById(selectedId) ?? null;
  }, [chatSource, conversations, selectedId]);

  const handleConversationsRefresh = useCallback((next: Conversation[]) => {
    setConversations(next);
  }, []);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    queueMicrotask(() => {
      selectedIdRef.current = selectedId;
    });
  }, [selectedId]);

  const onRemoteMessageForList = useCallback(
    (conversationId: string, row: ApiMessageWithReceipt, meta: { bumpUnread: boolean }) => {
      const preview = listPreviewFromApiMessage(row).slice(0, 240);
      const at = row.createdAt;
      const active = selectedIdRef.current;
      setConversations((prev) => {
        let found = false;
        const mapped = prev.map((c) => {
          if (c.id !== conversationId) return c;
          found = true;
          const bump = meta.bumpUnread && conversationId !== active;
          const unread =
            conversationId === active ? 0 : bump ? (c.unreadCount ?? 0) + 1 : (c.unreadCount ?? 0);
          return {
            ...c,
            lastMessagePreview: preview,
            lastMessageAt: at,
            unreadCount: unread,
          };
        });
        const list = found
          ? mapped
          : [
              ...mapped,
              {
                id: conversationId,
                title: "Trò chuyện",
                lastMessagePreview: preview,
                lastMessageAt: at,
                unreadCount: meta.bumpUnread && conversationId !== active ? 1 : 0,
              },
            ];
        return [...list].sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
      });
    },
    [],
  );

  const shell = (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 shrink-0 flex-col">
        {listError ? (
          <div
            className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-700"
            role="alert"
          >
            {listError}
          </div>
        ) : null}
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      <ChatPanel
        conversation={activeConversation}
        chatSource={chatSource}
        onConversationsRefresh={chatSource === "api" ? handleConversationsRefresh : undefined}
      />
    </div>
  );

  const conversationIds = useMemo(() => conversations.map((c) => c.id), [conversations]);

  if (chatSource === "api") {
    return (
      <ChatRealtimeProvider
        conversationIds={conversationIds}
        activeConversationId={selectedId}
        onRemoteMessageForList={onRemoteMessageForList}
      >
        {shell}
      </ChatRealtimeProvider>
    );
  }

  return shell;
}
