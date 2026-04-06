"use client";

import { useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/chat/ConversationList";
import { SidebarRail } from "@/components/chat/SidebarRail";
import { mockConversations } from "@/lib/mock-chat";

export function ChatShell() {
  const [selectedId, setSelectedId] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversation = useMemo(
    () => mockConversations.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
      <SidebarRail />
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
