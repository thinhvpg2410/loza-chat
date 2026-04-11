"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/chat/ConversationList";
import { getConversationById, mockConversations } from "@/lib/mock-chat";

export function ChatWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversation = selectedId ? getConversationById(selectedId) ?? null : null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ConversationList
        conversations={mockConversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ChatPanel conversation={activeConversation} />
    </div>
  );
}
