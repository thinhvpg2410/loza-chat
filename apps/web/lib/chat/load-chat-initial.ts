import { cookies } from "next/headers";
import { apiFetchJson, getApiBaseUrl } from "@/lib/api/server";
import { LOZA_ACCESS_COOKIE, LOZA_SESSION_COOKIE } from "@/lib/auth/constants";
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
  const base = getApiBaseUrl();
  const jar = await cookies();
  const isMockSession = jar.get(LOZA_SESSION_COOKIE)?.value === "mock";
  const token = jar.get(LOZA_ACCESS_COOKIE)?.value;

  if (!base || isMockSession || !token) {
    return { source: "mock" };
  }

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
