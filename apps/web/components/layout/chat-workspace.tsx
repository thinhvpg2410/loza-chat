"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/chat/ConversationList";
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
    if (!conversations.some((c) => c.id === selectedId)) {
      queueMicrotask(() => {
        setSelectedId(conversations[0]?.id ?? null);
      });
    }
  }, [conversations, selectedId]);

  const [searchQuery, setSearchQuery] = useState("");

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

  return (
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
}
