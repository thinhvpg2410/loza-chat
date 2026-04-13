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

export type MessageActionResult =
  | { ok: true; message: Message }
  | { ok: false; error: string };

export async function recallChatMessageAction(messageId: string): Promise<MessageActionResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>(`/messages/${messageId}/recall`, {
      method: "POST",
    });
    const row: ApiMessageWithReceipt = { ...res.message, sentByViewer: true };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không thu hồi được tin nhắn.",
    };
  }
}

export async function deleteChatMessageAction(messageId: string): Promise<MessageActionResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>(`/messages/${messageId}`, {
      method: "DELETE",
    });
    const row: ApiMessageWithReceipt = { ...res.message, sentByViewer: true };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không xóa được tin nhắn.",
    };
  }
}

export async function forwardChatMessageAction(input: {
  messageId: string;
  targetConversationId: string;
  clientMessageId: string;
}): Promise<MessageActionResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>(`/messages/${input.messageId}/forward`, {
      method: "POST",
      body: JSON.stringify({
        targetConversationId: input.targetConversationId,
        clientMessageId: input.clientMessageId,
      }),
    });
    const row: ApiMessageWithReceipt = { ...res.message, sentByViewer: true };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không chuyển tiếp được tin nhắn.",
    };
  }
}

export type ChatUploadInitResult =
  | {
      ok: true;
      uploadSessionId: string;
      uploadUrl: string;
      uploadMethod: "PUT";
      uploadHeaders: Record<string, string>;
      putBearerToken?: string;
    }
  | { ok: false; error: string };

function needsBearerForUploadPut(uploadUrl: string): boolean {
  try {
    return new URL(uploadUrl).pathname.includes("/uploads/mock-upload/");
  } catch {
    return false;
  }
}

export async function initChatUploadAction(input: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadType: "image" | "file" | "voice" | "video" | "other";
  width?: number;
  height?: number;
}): Promise<ChatUploadInitResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const init = await apiFetchJson<{
      uploadSessionId: string;
      upload: { url: string; method: "PUT"; headers: Record<string, string> };
    }>("/uploads/init", {
      method: "POST",
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadType: input.uploadType,
        ...(input.width !== undefined ? { width: input.width } : {}),
        ...(input.height !== undefined ? { height: input.height } : {}),
      }),
    });

    let putBearerToken: string | undefined;
    if (needsBearerForUploadPut(init.upload.url)) {
      const jar = await cookies();
      const token = jar.get(LOZA_ACCESS_COOKIE)?.value;
      if (!token) {
        return { ok: false, error: "Phiên đăng nhập không hợp lệ." };
      }
      putBearerToken = token;
    }

    return {
      ok: true,
      uploadSessionId: init.uploadSessionId,
      uploadUrl: init.upload.url,
      uploadMethod: init.upload.method,
      uploadHeaders: init.upload.headers,
      ...(putBearerToken ? { putBearerToken } : {}),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không khởi tạo được upload.",
    };
  }
}

export type CompleteChatUploadResult =
  | { ok: true; attachmentId: string }
  | { ok: false; error: string };

export async function completeChatUploadAction(
  uploadSessionId: string,
): Promise<CompleteChatUploadResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const done = await apiFetchJson<{ attachment: { id: string } }>(
      `/uploads/${uploadSessionId}/complete`,
      { method: "POST" },
    );
    return { ok: true, attachmentId: done.attachment.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không hoàn tất upload.",
    };
  }
}

export type SendWithAttachmentsResult =
  | { ok: true; message: Message }
  | { ok: false; error: string };

export async function sendChatMessageWithAttachmentsAction(input: {
  conversationId: string;
  clientMessageId: string;
  type: "image" | "file" | "voice" | "video" | "other";
  attachmentIds: string[];
  content?: string;
  replyToMessageId?: string;
}): Promise<SendWithAttachmentsResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const body: Record<string, unknown> = {
      conversationId: input.conversationId,
      clientMessageId: input.clientMessageId,
      type: input.type,
      attachmentIds: input.attachmentIds,
    };
    if (input.content && input.content.trim()) body.content = input.content.trim();
    if (input.replyToMessageId) body.replyToMessageId = input.replyToMessageId;

    const res = await apiFetchJson<{ message: ApiMessageWithReceipt }>(
      "/messages/with-attachments",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    const row: ApiMessageWithReceipt = {
      ...res.message,
      sentByViewer: true,
    };
    return { ok: true, message: mapSingleApiMessage(row, gate.base) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không gửi được tệp đính kèm.",
    };
  }
}

export type MessageReactionMutationResult =
  | { ok: true; summary: ApiMessageWithReceipt["reactions"] }
  | { ok: false; error: string };

export async function addChatMessageReactionAction(
  messageId: string,
  reaction: string,
): Promise<MessageReactionMutationResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const res = await apiFetchJson<{ summary: ApiMessageWithReceipt["reactions"]; alreadyExists?: boolean }>(
      `/messages/${messageId}/reactions`,
      { method: "POST", body: JSON.stringify({ reaction }) },
    );
    return { ok: true, summary: res.summary };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không gửi được cảm xúc.",
    };
  }
}

export async function removeChatMessageReactionAction(
  messageId: string,
  reaction: string,
): Promise<MessageReactionMutationResult> {
  const gate = await assertApiChatEnabled();
  if (!gate.ok) return { ok: false, error: gate.error };
  const encoded = encodeURIComponent(reaction);
  try {
    const res = await apiFetchJson<{ summary: ApiMessageWithReceipt["reactions"] }>(
      `/messages/${messageId}/reactions/${encoded}`,
      { method: "DELETE" },
    );
    return { ok: true, summary: res.summary };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không xóa được cảm xúc.",
    };
  }
}
