import { apiFetchJson } from "@/lib/api/server";
import { getWebApiSession } from "@/lib/auth/web-api-session";
import type { ApiConversationListItem } from "@/lib/chat/api-dtos";
import { mapConversationListItem } from "@/lib/chat/map-api-conversation";
import type { Conversation } from "@/lib/types/chat";

export type ChatHomeInitial =
  | { source: "mock" }
  | {
      source: "api";
      apiBaseUrl: string;
      conversations: Conversation[];
      listError: string | null;
    };

export async function loadChatHomeInitial(): Promise<ChatHomeInitial> {
  const session = await getWebApiSession();
  if (!session.active) {
    return { source: "mock" };
  }
  const base = session.baseUrl;

  try {
    const { conversations } = await apiFetchJson<{ conversations: ApiConversationListItem[] }>(
      "/conversations",
    );
    return {
      source: "api",
      apiBaseUrl: base,
      conversations: conversations.map(mapConversationListItem),
      listError: null,
    };
  } catch (e) {
    return {
      source: "api",
      apiBaseUrl: base,
      conversations: [],
      listError: e instanceof Error ? e.message : "Không tải được danh sách hội thoại.",
    };
  }
}
