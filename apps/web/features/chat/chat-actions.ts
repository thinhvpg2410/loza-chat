"use server";

import { cookies } from "next/headers";
import { apiFetchJson } from "@/lib/api/server";
import { LOZA_ACCESS_COOKIE } from "@/lib/auth/constants";
import { decodeJwtSub } from "@/lib/auth/decode-jwt-sub";
import { getWebApiSession } from "@/lib/auth/web-api-session";
import type { ApiConversationListItem, ApiMessageWithReceipt } from "@/lib/chat/api-dtos";
import { mapConversationListItem } from "@/lib/chat/map-api-conversation";
import { mapApiMessagesToChatMessages, mapSingleApiMessage } from "@/lib/chat/map-api-message";
import type { Conversation, Message } from "@/lib/types/chat";

export type ChatRealtimeSessionResult =
  | { ok: true; apiBaseUrl: string; accessToken: string; viewerUserId: string }
  | { ok: false; error: string };

/** Supplies Socket.IO auth + viewer id (server reads httpOnly cookie). */
export async function getChatRealtimeSessionAction(): Promise<ChatRealtimeSessionResult> {
  const session = await getWebApiSession();
  if (!session.active) {
    return { ok: false, error: "Phiên API không khả dụng." };
  }
  const jar = await cookies();
  const token = jar.get(LOZA_ACCESS_COOKIE)?.value;
  if (!token) {
    return { ok: false, error: "Không có access token." };
  }
  const viewerUserId = decodeJwtSub(token);
  if (!viewerUserId) {
    return { ok: false, error: "Không đọc được phiên đăng nhập." };
  }
  return {
    ok: true,
    apiBaseUrl: session.baseUrl,
    accessToken: token,
    viewerUserId,
  };
}

async function assertApiChatEnabled(): Promise<
  { ok: true; base: string } | { ok: false; error: string }
> {
  const session = await getWebApiSession();
  if (!session.active) {
    return { ok: false, error: "Chỉ khả dụng khi đăng nhập qua API." };
  }
  return { ok: true, base: session.baseUrl };
}

export type FetchMessagesResult =
  | { ok: true; messages: Message[]; nextCursor: string | null }
  | { ok: false; error: string };

export async function fetchConversationMessagesAction(
  conversationId: string,
  cursor?: string,
): Promise<FetchMessagesResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  const q = new URLSearchParams();
  q.set("limit", "50");
  if (cursor) q.set("cursor", cursor);

  try {
    const data = await apiFetchJson<{
      messages: ApiMessageWithReceipt[];
      nextCursor: string | null;
    }>(`/conversations/${conversationId}/messages?${q.toString()}`);

    return {
      ok: true,
      messages: mapApiMessagesToChatMessages(data.messages, gate.base),
      nextCursor: data.nextCursor,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tải được tin nhắn.",
    };
  }
}

export type ListConversationsResult =
  | { ok: true; conversations: Conversation[] }
  | { ok: false; error: string };

export async function fetchConversationsListAction(): Promise<ListConversationsResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const { conversations } = await apiFetchJson<{ conversations: ApiConversationListItem[] }>(
      "/conversations",
    );
    return { ok: true, conversations: conversations.map(mapConversationListItem) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tải được danh sách hội thoại.",
    };
  }
}

export type SendTextResult =
  | { ok: true; message: Message }
  | { ok: false; error: string };

export async function sendChatTextMessageAction(input: {
  conversationId: string;
  content: string;
  clientMessageId: string;
  replyToMessageId?: string;
}): Promise<SendTextResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const body: Record<string, string> = {
      conversationId: input.conversationId,
      content: input.content,
      clientMessageId: input.clientMessageId,
    };
    if (input.replyToMessageId) body.replyToMessageId = input.replyToMessageId;

    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const row: ApiMessageWithReceipt = {
      ...res.message,
      sentByViewer: true,
    };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không gửi được tin nhắn.",
    };
  }
}

export type SendStickerResult =
  | { ok: true; message: Message }
  | { ok: false; error: string };

export async function sendChatStickerMessageAction(input: {
  conversationId: string;
  stickerId: string;
  clientMessageId: string;
  replyToMessageId?: string;
}): Promise<SendStickerResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const body: Record<string, string> = {
      conversationId: input.conversationId,
      stickerId: input.stickerId,
      clientMessageId: input.clientMessageId,
    };
    if (input.replyToMessageId) body.replyToMessageId = input.replyToMessageId;

    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>("/messages/sticker", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const row: ApiMessageWithReceipt = {
      ...res.message,
      sentByViewer: true,
    };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không gửi được sticker.",
    };
  }
}

export async function markConversationReadAction(
  conversationId: string,
  messageId?: string,
): Promise<void> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return;

  try {
    const body = messageId ? JSON.stringify({ messageId }) : JSON.stringify({});
    await apiFetchJson(`/conversations/${conversationId}/read`, {
      method: "POST",
      body,
    });
  } catch {
    /* best-effort */
  }
}
