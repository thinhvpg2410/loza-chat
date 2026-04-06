"use client";

import { useMemo, useState } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { EmptyChatPanel } from "@/components/layout/empty-chat-panel";
import { mockConversations } from "@/lib/mock-chat";

export function ChatWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeTitle = useMemo(() => {
    const c = mockConversations.find((x) => x.id === selectedId);
    return c?.title ?? null;
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ConversationList
        conversations={mockConversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <EmptyChatPanel
        title={activeTitle ? `Open: ${activeTitle}` : "Select a conversation"}
        description={
          activeTitle
            ? "Chat messages and composer will load here when messaging is wired to the API."
            : "Choose a chat from the list. The main thread opens here in a later phase."
        }
      />
    </div>
  );
}
