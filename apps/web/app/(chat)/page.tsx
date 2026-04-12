import { ChatWorkspace } from "@/components/layout/chat-workspace";
import { loadChatHomeInitial } from "@/lib/chat/load-chat-initial";

export default async function ChatHomePage() {
  const initial = await loadChatHomeInitial();

  if (initial.source === "mock") {
    return <ChatWorkspace chatSource="mock" />;
  }

  return (
    <ChatWorkspace
      chatSource="api"
      initialApiConversations={initial.conversations}
      listError={initial.listError}
    />
  );
}
