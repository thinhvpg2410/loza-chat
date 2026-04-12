import { Suspense } from "react";
import { ChatWorkspace } from "@/components/layout/chat-workspace";
import { loadChatHomeInitial } from "@/lib/chat/load-chat-initial";

function ChatFallback() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--zalo-chat-bg)] text-[13px] text-[var(--zalo-text-muted)]">
      Đang tải…
    </div>
  );
}

export default async function ChatHomePage() {
  const initial = await loadChatHomeInitial();

  if (initial.source === "mock") {
    return (
      <Suspense fallback={<ChatFallback />}>
        <ChatWorkspace chatSource="mock" />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatWorkspace
        chatSource="api"
        initialApiConversations={initial.conversations}
        listError={initial.listError}
      />
    </Suspense>
  );
}
